import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'USER',
    pass: 'PASSWORD'
  }
});

const app = express();
const PORT = 3000;
const DATA_FILE_PATH = path.join(process.cwd(), 'data.json');

const DEFAULT_DATA = {
  users: {},
  tokens: {}
};

async function ensureDataFile() {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.users) {
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
    }
  } catch {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  }
}

async function readData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed.users) parsed.users = {};
  if (!parsed.tokens) parsed.tokens = {};
  return parsed;
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.use(cors());
app.use(express.json());

const unauthorized = (res: express.Response) => {
  return res.status(401).json({ error: 'Session unauthorized or expired.' });
};

function getAuthenticatedUser(req: express.Request, data: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!token) return null;
  // 1. Try tokens table map (magic-link)
  if (data.tokens && data.tokens[token]) {
    return data.tokens[token];
  }
  // 2. Try legacy username/password table keys if any
  if (data.users && data.users[token]) {
    return token;
  }
  return null;
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const trimmed = username.trim();
    if (trimmed.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters.' });
    }

    const data = await readData();
    if (data.users[trimmed]) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    data.users[trimmed] = {
      password: password,
      categories: [
        { name: "Groceries", budget: 3000000 },
        { name: "Coffee & Dining", budget: 1500000 },
        { name: "Investments", budget: 2000000 }
      ],
      transactions: [],
      profile: {
        nickname: "Anonymous Journaler",
        avatarUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150", 
        bio: "Quietly writing down where life flows."
      },
      zenPoints: 0,
      debts: []
    };

    await writeData(data);
    res.json({ success: true, message: 'Account registered successfully.' });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const trimmed = username.trim();
    const data = await readData();
    
    const user = data.users[trimmed];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    res.json({
      token: trimmed,
      username: trimmed
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.post('/api/auth/magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    const data = await readData();
    if (!data.magicLinks) {
      data.magicLinks = {};
    }
    
    // Create new user space if they don't exist yet
    if (!data.users[cleanEmail]) {
      data.users[cleanEmail] = {
        email: cleanEmail,
        categories: [
          { name: "Groceries", budget: 3000000 },
          { name: "Coffee & Dining", budget: 1500000 },
          { name: "Investments", budget: 2000000 }
        ],
        transactions: [],
        profile: {
          nickname: "Anonymous Journaler",
          avatarUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150", 
          bio: "Quietly writing down where life flows."
        },
        zenPoints: 0,
        debts: []
      };
    }
    
    // Create cryptographic token and expiration (15 minutes)
    const token = crypto.randomBytes(32).toString('hex');
    data.magicLinks[token] = {
      email: cleanEmail,
      expires: Date.now() + 15 * 60 * 1000
    };
    
    await writeData(data);
    
    // Construct the absolute verification URL dynamically
    const referer = req.headers.referer || req.headers.origin;
    let baseUrl = '';
    if (referer) {
      baseUrl = referer.replace(/\/?$/, '');
    } else {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
      baseUrl = `${protocol}://${host}`;
    }
    
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
    
    console.log(`[REAL GMAIL MAGIC LINK DISPATCH FOR ${cleanEmail}]: ${verifyUrl}`);

    // Send the dynamic HTML email via Gmail
    await transporter.sendMail({
      from: '"Tachi." <nguyentrandn24@gmail.com>',
      to: cleanEmail,
      subject: 'Your Magic Access Link for Tachi.',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, serif; padding: 32px; background-color: #FDFBF7; color: #2D3B32; border: 1px solid rgba(45, 59, 50, 0.15); max-width: 500px; border-radius: 12px; margin: 0 auto;">
          <h2 style="font-family: Georgia, serif; font-size: 22px; font-weight: normal; margin-top: 0; margin-bottom: 8px; color: #2D3B32; letter-spacing: -0.01em;">Tachi.</h2>
          <p style="font-size: 13px; line-height: 1.5; color: rgba(45, 59, 50, 0.7); font-style: italic; margin-top: 0; margin-bottom: 24px;">
            "Quietly writing down where life flows."
          </p>
          <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px; color: #2D3B32;">
            You requested an access key to open your personal pocket journal. Click the button below to authorize your session. This link will expire in 15 minutes.
          </p>
          <div style="margin-top: 28px; margin-bottom: 28px;">
            <a href="${verifyUrl}" style="background-color: #8FA88B; color: #FDFBF7; text-decoration: none; padding: 12px 24px; font-size: 11px; font-weight: bold; border-radius: 6px; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block; transition: background-color 0.2s;">Open Your Journal</a>
          </div>
          <p style="font-size: 11px; line-height: 1.5; color: rgba(45, 59, 50, 0.5); border-top: 1px dashed rgba(45, 59, 50, 0.2); padding-top: 16px; margin-top: 24px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this link in your address bar:<br/>
            <a href="${verifyUrl}" style="color: #8FA88B; text-decoration: none; word-break: break-all;">${verifyUrl}</a>
          </p>
        </div>
      `
    });
    
    res.json({
      success: true,
      message: 'Magic link dispatched successfully via email.'
    });
  } catch (error) {
    console.error('Magic link generation failed:', error);
    res.status(500).json({ error: 'Server error generating magic link.' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('Authentication token is required.');
    }

    const tokenStr = String(token);
    const data = await readData();

    if (!data.magicLinks || !data.magicLinks[tokenStr]) {
      return res.status(400).send('Invalid or expired authentication link.');
    }

    const { email, expires } = data.magicLinks[tokenStr];

    if (Date.now() > expires) {
      delete data.magicLinks[tokenStr];
      await writeData(data);
      return res.status(400).send('This authentication link has expired.');
    }

    // Generate session token
    const sessionToken = 'session_' + crypto.randomBytes(16).toString('hex');
    
    if (!data.tokens) {
      data.tokens = {};
    }
    data.tokens[sessionToken] = email;

    // Clean up used magic-link token
    delete data.magicLinks[tokenStr];

    await writeData(data);

    // Redirect back to client root carrying the fresh session token
    res.redirect(`/?auth_token=${sessionToken}`);
  } catch (error) {
    console.error('Magic link verification failed:', error);
    res.status(500).send('Server error verifying magic link.');
  }
});

function triggerRecurringTransactions(userRecord: any): boolean {
  if (!userRecord.recurringRules) {
    userRecord.recurringRules = [];
  }
  if (!userRecord.transactions) {
    userRecord.transactions = [];
  }

  let changed = false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthStr = currentMonthNum < 10 ? `0${currentMonthNum}` : `${currentMonthNum}`;
  const currentYearMonth = `${currentYear}-${currentMonthStr}`; // e.g. "2026-06"
  const currentDay = now.getDate();

  for (const rule of userRecord.recurringRules) {
    // If the scheduled day of month is today or has passed
    if (currentDay >= Number(rule.dayOfMonth)) {
      // Check if we already created a transaction for this rule in the current year-month
      const alreadyCreated = userRecord.transactions.some((t: any) => 
        t.recurringId === rule.id && t.date.startsWith(currentYearMonth)
      );

      if (!alreadyCreated) {
        const dayStr = Number(rule.dayOfMonth) < 10 ? `0${rule.dayOfMonth}` : `${rule.dayOfMonth}`;
        const transactionDate = `${currentYearMonth}-${dayStr}`;

        const newTrans = {
          id: `t_rec_${rule.id}_${currentYearMonth}`,
          amount: Number(rule.amount),
          category: rule.category || (rule.type === 'income' ? 'Income' : 'Essential'),
          note: `[\u0110\u1ecbnh k\u1ef3] ${rule.name}`,
          date: transactionDate,
          recurringId: rule.id,
          mood: rule.type === 'expense' ? 'essential' : undefined,
          type: rule.type || 'expense'
        };

        userRecord.transactions.unshift(newTrans);
        changed = true;
      }
    }
  }

  return changed;
}

function ensureUserDefaults(userRecord: any) {
  if (!userRecord.recurringRules) userRecord.recurringRules = [];
  if (!userRecord.transactions) userRecord.transactions = [];
  if (!userRecord.zenPoints) userRecord.zenPoints = 0;
  if (!userRecord.debts) userRecord.debts = [];
  if (!userRecord.categories) {
    userRecord.categories = [
      { name: "Groceries", budget: 3000000 },
      { name: "Coffee & Dining", budget: 1500000 },
      { name: "Investments", budget: 2000000 }
    ];
  }
  if (!userRecord.profile) {
    userRecord.profile = {
      nickname: "Anonymous Journaler",
      avatarUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150",
      bio: "Quietly writing down where life flows."
    };
  }
}

app.get('/api/auth/me', async (req, res) => {
  try {
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);
    
    const userRecord = data.users[username];
    let changed = false;
    
    if (!userRecord.recurringRules) {
      userRecord.recurringRules = [];
      changed = true;
    }

    // Trigger check for automations/recurring transactions
    const triggeredAny = triggerRecurringTransactions(userRecord);
    if (triggeredAny) {
      changed = true;
    }

    // Perform migration if legacy budget properties exist
    if (!userRecord.categories) {
      if (userRecord.budget) {
        userRecord.categories = [
          { name: "Essential", budget: Number(userRecord.budget.essential || 5000000) },
          { name: "Enjoyment", budget: Number(userRecord.budget.enjoyment || 3000000) },
          { name: "Savings", budget: Number(userRecord.budget.savings || 2000000) }
        ];
      } else {
        userRecord.categories = [
          { name: "Groceries", budget: 3000000 },
          { name: "Coffee & Dining", budget: 1500000 },
          { name: "Investments", budget: 2000000 }
        ];
      }
      changed = true;
    }

    if (!userRecord.profile) {
      userRecord.profile = {
        nickname: "Anonymous Journaler",
        avatarUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150", 
        bio: "Quietly writing down where life flows."
      };
      changed = true;
    }

    if (userRecord.zenPoints === undefined) {
      userRecord.zenPoints = 0;
      changed = true;
    }
    if (!userRecord.debts) {
      userRecord.debts = [];
      changed = true;
    }

    if (changed) {
      await writeData(data);
    }
    
    res.json({
      email: username,
      categories: userRecord.categories,
      transactions: userRecord.transactions || [],
      profile: userRecord.profile,
      recurringRules: userRecord.recurringRules || [],
      zenPoints: userRecord.zenPoints || 0,
      debts: userRecord.debts || []
    });
  } catch (error) {
    console.error('Failed in /api/auth/me:', error);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    let changed = false;
    
    if (!userRecord.recurringRules) {
      userRecord.recurringRules = [];
      changed = true;
    }

    if (!userRecord.categories) {
      userRecord.categories = [
        { name: "Groceries", budget: 3000000 },
        { name: "Coffee & Dining", budget: 1500000 },
        { name: "Investments", budget: 2000000 }
      ];
      changed = true;
    }

    if (!userRecord.profile) {
      userRecord.profile = {
        nickname: "Anonymous Journaler",
        avatarUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150", 
        bio: "Quietly writing down where life flows."
      };
      changed = true;
    }

    if (userRecord.zenPoints === undefined) {
      userRecord.zenPoints = 0;
      changed = true;
    }
    if (!userRecord.debts) {
      userRecord.debts = [];
      changed = true;
    }

    if (changed) {
      await writeData(data);
    }

    res.json({
      categories: userRecord.categories,
      transactions: userRecord.transactions || [],
      profile: userRecord.profile,
      recurringRules: userRecord.recurringRules || [],
      zenPoints: userRecord.zenPoints || 0,
      debts: userRecord.debts || []
    });
  } catch (error) {
    console.error('Failed to fetch data:', error);
    res.status(500).json({ error: 'Server error fetching data.' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, category, note, mood, type } = req.body;
    if (!amount || !category || !note) {
      return res.status(400).json({ error: 'Amount, category and note are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.transactions) {
      userRecord.transactions = [];
    }

    const newTransaction = {
      id: `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Number(amount),
      category: category.trim(),
      note: note.trim(),
      date: new Date().toISOString().split('T')[0],
      mood: mood || 'essential',
      type: type || 'expense'
    };

    userRecord.transactions.unshift(newTransaction);
    await writeData(data);

    res.json(userRecord.transactions);
  } catch (error) {
    console.error('Failed to add transaction:', error);
    res.status(500).json({ error: 'Server error adding transaction.' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    userRecord.transactions = (userRecord.transactions || []).filter((t: any) => t.id !== id);

    await writeData(data);
    res.json(userRecord.transactions);
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    res.status(500).json({ error: 'Server error deleting transaction.' });
  }
});

app.post('/api/recurring', async (req, res) => {
  try {
    const { type, amount, name, dayOfMonth, category } = req.body;
    if (!type || amount === undefined || !name || dayOfMonth === undefined) {
      return res.status(400).json({ error: 'Type, amount, name and dayOfMonth are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.recurringRules) {
      userRecord.recurringRules = [];
    }

    const newRule = {
      id: `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      amount: Number(amount),
      name: name.trim(),
      dayOfMonth: Number(dayOfMonth),
      category: category || undefined
    };

    userRecord.recurringRules.push(newRule);

    // Call recurring triggers to instantly evaluate the rule for this month
    triggerRecurringTransactions(userRecord);

    await writeData(data);
    res.json({
      recurringRules: userRecord.recurringRules,
      transactions: userRecord.transactions || []
    });
  } catch (error) {
    console.error('Failed to add recurring rule:', error);
    res.status(500).json({ error: 'Server error adding automation rule.' });
  }
});

app.delete('/api/recurring/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.recurringRules) {
      userRecord.recurringRules = [];
    }

    userRecord.recurringRules = userRecord.recurringRules.filter((r: any) => r.id !== id);

    await writeData(data);
    res.json({ recurringRules: userRecord.recurringRules });
  } catch (error) {
    console.error('Failed to delete recurring rule:', error);
    res.status(500).json({ error: 'Server error deleting automation rule.' });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const { nickname, avatarUrl, bio } = req.body;
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.profile) {
      userRecord.profile = {
        nickname: "Anonymous Journaler",
        avatarUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150", 
        bio: "Quietly writing down where life flows."
      };
    }

    if (nickname !== undefined) userRecord.profile.nickname = String(nickname).trim() || "Anonymous Journaler";
    if (avatarUrl !== undefined) userRecord.profile.avatarUrl = String(avatarUrl).trim() || "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150";
    if (bio !== undefined) userRecord.profile.bio = String(bio).trim();

    await writeData(data);
    res.json({ profile: userRecord.profile });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, budget } = req.body;
    if (!name || budget === undefined) {
      return res.status(400).json({ error: 'Category name and budget are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.categories) {
      userRecord.categories = [];
    }

    const trimmed = String(name).trim();
    if (userRecord.categories.some((c: any) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    userRecord.categories.push({ name: trimmed, budget: Number(budget) });
    await writeData(data);
    res.json({ categories: userRecord.categories });
  } catch (error) {
    console.error('Failed to add category:', error);
    res.status(500).json({ error: 'Server error adding category.' });
  }
});

app.put('/api/categories', async (req, res) => {
  try {
    const { name, budget } = req.body;
    if (!name || budget === undefined) {
      return res.status(400).json({ error: 'Category name and budget are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    const cat = userRecord.categories.find((c: any) => c.name.toLowerCase() === String(name).toLowerCase().trim());
    if (!cat) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    cat.budget = Number(budget);
    await writeData(data);
    res.json({ categories: userRecord.categories });
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Server error updating category.' });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    const beforeLen = userRecord.categories.length;
    userRecord.categories = userRecord.categories.filter((c: any) => c.name.toLowerCase() !== decodeURIComponent(name).toLowerCase());
    
    if (userRecord.categories.length === beforeLen) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Fallback transactions to Uncategorized
    if (userRecord.transactions) {
      userRecord.transactions.forEach((t: any) => {
        if (t.category.toLowerCase() === decodeURIComponent(name).toLowerCase()) {
          t.category = 'Uncategorized';
        }
      });
    }

    await writeData(data);
    res.json({
      categories: userRecord.categories,
      transactions: userRecord.transactions || []
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Server error deleting category.' });
  }
});

app.post('/api/transactions/scan-invoice', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const prompt = `Analyze this invoice/receipt image and extract the following information:
1. Total amount (in VND, number only)
2. Item name or description
3. Category (e.g., Groceries, Dining, Utilities, Entertainment, Transportation, Healthcare, Shopping, Other)
4. Mood classification: 'essential' (necessary expenses), 'joy' (pleasure/enjoyment), or 'impulsive' (unplanned purchases)

Return ONLY a JSON object with these exact keys: amount (number), name (string), category (string), mood (string). No markdown, no extra text.`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'user', parts: [{ text: `Image URL: ${imageUrl}` }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            mood: { type: Type.STRING }
          },
          required: ['amount', 'name', 'category', 'mood']
        }
      }
    });

    const text = geminiResponse.text || '{}';
    const parsed = JSON.parse(text);

    res.json({
      amount: parsed.amount || 0,
      name: parsed.name || 'Unknown item',
      category: parsed.category || 'Uncategorized',
      mood: ['essential', 'joy', 'impulsive'].includes(parsed.mood) ? parsed.mood : 'essential'
    });
  } catch (error) {
    console.error('Invoice scan failed:', error);
    res.status(500).json({ error: 'Failed to analyze invoice image.' });
  }
});

app.get('/api/user/zen-points', async (req, res) => {
  try {
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (userRecord.zenPoints === undefined) {
      userRecord.zenPoints = 0;
      await writeData(data);
    }
    res.json({ zenPoints: userRecord.zenPoints });
  } catch (error) {
    console.error('Failed to get zen points:', error);
    res.status(500).json({ error: 'Server error fetching zen points.' });
  }
});

app.put('/api/user/zen-points', async (req, res) => {
  try {
    const { increment } = req.body;
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (userRecord.zenPoints === undefined) {
      userRecord.zenPoints = 0;
    }
    userRecord.zenPoints += Number(increment) || 0;
    await writeData(data);
    res.json({ zenPoints: userRecord.zenPoints });
  } catch (error) {
    console.error('Failed to update zen points:', error);
    res.status(500).json({ error: 'Server error updating zen points.' });
  }
});

app.post('/api/debts', async (req, res) => {
  try {
    const { name, amount, interestRate, type } = req.body;
    if (!name || amount === undefined) {
      return res.status(400).json({ error: 'Name and amount are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.debts) userRecord.debts = [];

    const newDebt = {
      id: `debt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      amount: Number(amount),
      interestRate: Number(interestRate) || 0,
      type: type || 'owe_someone'
    };

    userRecord.debts.push(newDebt);
    await writeData(data);
    res.json({ debts: userRecord.debts });
  } catch (error) {
    console.error('Failed to add debt:', error);
    res.status(500).json({ error: 'Server error adding debt.' });
  }
});

app.delete('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.debts) userRecord.debts = [];
    userRecord.debts = userRecord.debts.filter((d: any) => d.id !== id);

    await writeData(data);
    res.json({ debts: userRecord.debts });
  } catch (error) {
    console.error('Failed to delete debt:', error);
    res.status(500).json({ error: 'Server error deleting debt.' });
  }
});

app.post('/api/user/intelligence', async (req, res) => {
  try {
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    const transactions = userRecord.transactions || [];
    const categories = userRecord.categories || [];
    
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const totalExpense = transactions
      .filter((t: any) => t.type !== 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const totalBudget = categories.reduce((sum: number, c: any) => sum + Number(c.budget || 0), 0);
    
    const moods = { essential: 0, joy: 0, impulsive: 0 };
    transactions.forEach((t: any) => {
      if (t.type !== 'income' && t.mood) {
        moods[t.mood as keyof typeof moods] = (moods[t.mood as keyof typeof moods] || 0) + Number(t.amount || 0);
      }
    });
    
    const dominantMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';
    
    let archetype = 'The Balanced Stoic';
    if (moods.essential > moods.joy && moods.essential > moods.impulsive) archetype = 'The Pragmatic Guardian';
    if (moods.joy > moods.essential && moods.joy > moods.impulsive) archetype = 'The Mindful Hedonist';
    if (moods.impulsive > moods.essential && moods.impulsive > moods.joy) archetype = 'The Free Spirit';
    if (totalIncome > totalExpense * 2) archetype = 'The Wealth Accumulator';
    if (totalExpense > totalIncome * 1.5) archetype = 'The Growth Seeker';
    
    const totalSpending = totalExpense || 1;
    
    res.json({
      summary: `You have tracked ${transactions.length} transactions with a total income of ${totalIncome.toLocaleString()}\u0111 and expenses of ${totalExpense.toLocaleString()}\u0111. Your dominant spending mood is ${dominantMood}.`,
      archetype,
      letter: `Dear ${userRecord.profile?.nickname || 'Journaler'},\n\nYour financial journey reveals a pattern of ${dominantMood} spending. You tend to prioritize ${moods.essential > moods.joy ? 'practical needs' : 'enjoyment and experiences'}. Your total budget allocation is ${totalBudget.toLocaleString()}\u0111, which gives you a ${totalBudget > totalExpense ? 'healthy' : 'challenging'} financial foundation.\n\nKeep writing, keep flowing.\n\nTachi.`,
      meters: {
        savings: Math.min(100, Math.round((totalIncome - totalExpense) / Math.max(totalIncome, 1) * 100)),
        impulsive: Math.min(100, Math.round((moods.impulsive / totalSpending) * 100)),
        balanced: Math.min(100, Math.round((moods.essential / totalSpending) * 100))
      }
    });
  } catch (error) {
    console.error('Intelligence generation failed:', error);
    res.status(500).json({ error: 'Server error generating intelligence.' });
  }
});

async function startServer() {
  await ensureDataFile();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
