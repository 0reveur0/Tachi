import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
      }
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
         }
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
          note: `[Định kỳ] ${rule.name}`,
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

    if (changed) {
      await writeData(data);
    }
    
    res.json({
      email: username,
      categories: userRecord.categories,
      transactions: userRecord.transactions || [],
      profile: userRecord.profile,
      recurringRules: userRecord.recurringRules || []
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

    // Trigger check for automations/recurring transactions
    const triggeredAny = triggerRecurringTransactions(userRecord);
    if (triggeredAny) {
      changed = true;
    }

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

    if (changed) {
      await writeData(data);
    }

    res.json({
      categories: userRecord.categories,
      transactions: userRecord.transactions || [],
      profile: userRecord.profile,
      recurringRules: userRecord.recurringRules || []
    });
  } catch (error) {
    console.error('Failed to get user data:', error);
    res.status(500).json({ error: 'Server error reading data.' });
  }
});

app.get('/api/user/intelligence', async (req, res) => {
  try {
    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    const transactions = userRecord.transactions || [];
    const categories = userRecord.categories || [];
    const recurringRules = userRecord.recurringRules || [];

    // Calculate metrics
    let totalSpent = 0;
    let impulsiveSpent = 0;
    let savingsSpent = 0;
    let totalIncome = 0;

    transactions.forEach((t: any) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        totalSpent += amt;
        if (t.mood === 'impulsive') {
          impulsiveSpent += amt;
        }
        
        const catName = (t.category || '').toLowerCase();
        if (
          catName.includes('saving') ||
          catName.includes('tích lũy') ||
          catName.includes('tích luỹ') ||
          catName.includes('invest') ||
          catName.includes('hũ tiết kiệm') ||
          catName.includes('tích tài sản')
        ) {
          savingsSpent += amt;
        }
      }
    });

    // Estimate income if totalIncome from manual transactions is 0
    const recurringMonthlyIncome = recurringRules
      .filter((r: any) => r.type === 'income')
      .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

    const effectiveIncome = Math.max(totalIncome, recurringMonthlyIncome, 1000000);

    // Calculate spend per category to check category limits Exceeded
    const catSpend: Record<string, number> = {};
    const moodBreakdown: Record<string, number> = { essential: 0, joy: 0, impulsive: 0, neutral: 0 };

    transactions.forEach((t: any) => {
      if (t.type !== 'income') {
        const cat = t.category || 'Uncategorized';
        const amt = Number(t.amount) || 0;
        catSpend[cat] = (catSpend[cat] || 0) + amt;

        const mood = (t.mood || 'neutral').toLowerCase();
        moodBreakdown[mood] = (moodBreakdown[mood] || 0) + amt;
      }
    });

    let noCategoryLimitsExceeded = true;
    for (const cat of categories) {
      const spent = catSpend[cat.name] || 0;
      const limit = Number(cat.budget) || 0;
      const isSavingCat = 
        cat.name.toLowerCase().includes('saving') ||
        cat.name.toLowerCase().includes('tích lũy') ||
        cat.name.toLowerCase().includes('tích luỹ') ||
        cat.name.toLowerCase().includes('invest');

      if (!isSavingCat && spent > limit && limit > 0) {
        noCategoryLimitsExceeded = false;
        break;
      }
    }

    // Scoring conditions
    const impulsivePercentage = totalSpent > 0 ? (impulsiveSpent / totalSpent) * 100 : 0;
    const savingsPercentage = effectiveIncome > 0 ? (savingsSpent / effectiveIncome) * 100 : 0;

    let archetypeId = 'The Serene Observer';
    let archetypeName = 'The Serene Observer';
    let archetypeTitleValue = 'Người Quan Sát Tĩnh Lặng';

    if (totalSpent > 0 && impulsivePercentage > 35) {
      archetypeId = 'The Romantic Aesthetician';
      archetypeName = 'The Romantic Aesthetician';
      archetypeTitleValue = 'The Romantic Aesthetician';
    } else if (savingsPercentage > 40) {
      archetypeId = 'The Frugal Scholar';
      archetypeName = 'The Frugal Scholar';
      archetypeTitleValue = 'The Frugal Scholar';
    } else if (noCategoryLimitsExceeded && transactions.length > 0) {
      archetypeId = 'The Balanced Alchemist';
      archetypeName = 'The Balanced Alchemist';
      archetypeTitleValue = 'The Balanced Alchemist';
    }

    // Generate Vietnam-adapted Retro "Letter from the Editor" text (Fallback)
    let letterContent = '';
    if (archetypeId === 'The Romantic Aesthetician') {
      letterContent = `Thư gửi một tâm hồn nghệ sĩ bay bổng,

Tôi mở cuốn sổ tay và ngắm nghía từng nét bút kí họa hành trình trải nghiệm của bạn. Tôi nhận ra bạn là một người tôn thờ khoảnh khắc và sự duy mỹ sâu sắc. Bạn sở hữu chỉ số bốc đồng (Impulsive) phiêu bạt đạt trên ${impulsivePercentage.toFixed(0)}% tổng chi tiêu. Với bạn, tiền bạc không đơn thuần là những con số đông cứng trên giấy; chúng là phương tiện để bạn đổi lấy nguồn năng lượng rực rỡ hằng ngày, ôm trọn những rung động của cảm xúc tức thời.

Tuy nhiên, hỡi người nghệ sĩ tài hoa, một bức tranh lộng lẫy và duy mỹ nhất cũng đòi hỏi một bộ khung vững chãi để không bị thời gian xói mòn. Nguyên lý Wabi-Sabi dạy chúng ta tìm kiếm sự trường tồn trong những cấu trúc giản đơn, mộc mạc nhất. Hãy thử đặt ra ranh giới nhỏ, tạo một chiếc hũ tích lũy tĩnh lặng bên cạnh những hũ chi tiêu ngẫu hứng. Việc xây dựng nền móng này không làm dập tắt ngọn lửa sáng tạo của bạn, trái lại, nó giúp bạn kiêu hãnh phiêu du ngàn dặm xa mà không sợ bão tố cuộc đời kéo đến đột ngột.

Thân ái từ chiếc bàn gỗ mộc mạc,
Người Biên Tập Cuốn Sổ Tay Tachi`;
    } else if (archetypeId === 'The Frugal Scholar') {
      letterContent = `Thư viết cho một khối óc uyên bác và đầy tính kỷ luật,

Mỗi nét chữ mộc mạc ghi lại việc phân bổ dòng tiền của bạn phản chiếu sự tỉ mỉ, thấu suốt tường tận của một tư duy nghiên cứu đầy thông thái. Việc dành hơn ${savingsPercentage.toFixed(0)}% tổng thu nhập đổ vào các hũ tích lũy và tiết kiệm biểu thị bạn là 'The Frugal Scholar' (Học giả Tiết kiệm) kiên trì bền bỉ hệt như cổ thụ đứng vững qua bao mùa bão nổi. Bạn thấu hiểu quy luật gieo trồng và gặt hái sau những chu kỳ tuần hoàn đầy kiên nhẫn.

Dẫu thế, người bạn uyên bác ơi, sự thấu triệt triết lý Wabi-Sabi thực sự nằm ở sự chấp nhận và bao dung với thực tại dang dở, đôi khi là sự thả lỏng để tận hưởng khoảnh khắc dưới bóng râm yên bình. Tiền bạc suy cho cùng là dòng chảy năng lượng trung dung giúp cuộc sống thêm nở hoa. Kỷ luật quá khắc nghiệt đôi khi vô tình dựng lên rào chắn ngăn bạn đón nhận những niềm vui bình dị hằng ngày. Chiều nay, hãy thử cho phép mình trích một khoản nhỏ mua lấy một tách trà ấm, một nhành hoa thơm mà không cần đặt nặng bất kỳ kế hoạch nào để cảm nhận sự trọn vẹn của cuộc sống trong hiện tại.

Thân ái từ chiếc bàn gỗ mộc mạc,
Người Biên Tập Cuốn Sổ Tay Tachi`;
    } else if (archetypeId === 'The Balanced Alchemist') {
      letterContent = `Thư gửi một nhà giả kim cân bằng kỳ diệu đầy thông tuệ,

Chứng kiến cách bạn dung hòa những nguồn năng lượng vật chất chảy trôi rực rỡ qua cuốn sổ Tachi mang đến một niềm tin yên ả kỳ lạ. Bạn bảo toàn tuyệt đối giới hạn của tất cả các hũ ngân sách mà không có một dấu hiệu rò rỉ hay vượt hạn mức lãng phí nào xảy ra. Bạn là một 'The Balanced Alchemist' (Nhà Giả Kim Cân Bằng) đích thực, người thấu suốt nghệ thuật phân bổ tài chính một cách thanh tao, nhịp nhàng như nhịp thở khoan thai của vạn vật.

Sự cân bằng này là cảnh giới tối thượng mà bao người lữ khách ngoài kia lạc lối miệt mài kiếm tìm qua năm tháng. Bạn biết rõ thời điểm cần chắt chiu vun vén, và cũng thấu triệt lúc nào cần xả bớt dòng nước trong lành tưới tắm cho thềm cỏ hiện tại. Để nâng độ sâu sác của hành trình này lên một trạng thái thăng hoa mới, hãy dùng chiếc bàn tính trượt lạm phát tinh xảo ngay bên dưới để vạch định 'Target Day' của mình. Con đường tự do toàn vẹn đang mở ra rất mực thênh thang trước mắt bạn.

Thân ái từ chiếc bàn gỗ mộc mạc,
Người Biên Tập Cuốn Sổ Tay Tachi`;
    } else {
      letterContent = `Thư gửi người lữ khách tĩnh lặng tìm kiếm sự bình yên,

Tôi quan sát cuốn sổ tay của bạn hệt như ngắm nhìn mặt hồ phẳng sương khói mờ ảo trong sương ban sớm. Mọi dòng tiền của bạn hiện tại đang chảy trôi êm đềm, khoan thai, thong dong mà chưa hề lệch về một thái cực quá đà nào cả. Trạng thái của bạn chính là một 'Người Quan Sát Tĩnh Lặng' đầy suy tư, bước từng bước nhỏ chậm rãi nhưng chuẩn xác để thấu hiểu vẹn tròn giá trị sống tiềm tàng bên trong mình.

Những hành trình vĩ đại nhất đều bắt đầu từ một khoảng lặng bình tâm để thấu triệt sâu xa toàn bộ bức tranh dòng chảy tài chính cá nhân. Hãy tiếp tục lưu giữ thói quen mở sổ Tachi mỗi chiều muộn, viết xuống các giao dịch nhỏ đi kèm với những tag cảm xúc thành thực nhất. Trí tuệ độc bản sẽ tự khắc nảy mầm từ sự lưu tâm nhỏ bé đó hằng ngày của bạn.

Thân ái từ chiếc bàn gỗ mộc mạc,
Người Biên Tập Cuốn Sổ Tay Tachi`;
    }

    // Determine intuitive dynamic indices for progress bars representation (0-100)
    let fillSavings = Math.min(100, Math.round(savingsPercentage));
    let fillImpulsive = Math.min(100, Math.round(impulsivePercentage));
    
    // Investing/balanced index computed with remaining weight or direct category calculations
    const investmentBudgetSum = categories
      .filter((c: any) => c.name.toLowerCase().includes('invest') || c.name.toLowerCase().includes('saving') || c.name.toLowerCase().includes('tích lũy'))
      .reduce((sum: number, c: any) => sum + (Number(c.budget) || 0), 0);
    const totalBudgetSum = categories.reduce((sum: number, c: any) => sum + (Number(c.budget) || 0), 0);
    let fillBalanced = totalBudgetSum > 0 ? Math.min(100, Math.round((investmentBudgetSum / totalBudgetSum) * 100)) : 40;

    // ensure minimum values for better styling visualization
    if (fillSavings === 0 && transactions.length > 0) fillSavings = 15;
    if (fillImpulsive === 0 && transactions.length > 0) fillImpulsive = 10;
    if (fillBalanced === 0) fillBalanced = 25;

    // Prepare text summary to feed into Gemini AI instructions
    const summaryParts = [
      `Người dùng ${username} đã tiêu tổng cộng ${totalSpent.toLocaleString('vi-VN')}đ.`,
      `Tổng thu nhập ghi nhận trong tháng: ${effectiveIncome.toLocaleString('vi-VN')}đ.`,
      `Số dư tiết kiệm/tích lũy thu hoạch được: ${savingsSpent.toLocaleString('vi-VN')}đ.`
    ];

    if (totalSpent > 0) {
      summaryParts.push("Hành vi phân bổ theo tâm trạng (mood tags):");
      Object.entries(moodBreakdown).forEach(([mood, amt]) => {
        if (amt > 0) {
          const pct = ((amt / totalSpent) * 100).toFixed(0);
          summaryParts.push(`- ${mood}: ${amt.toLocaleString('vi-VN')}đ (${pct}%)`);
        }
      });

      summaryParts.push("Chi tiết danh mục đã chi tiêu:");
      Object.entries(catSpend).forEach(([cat, amt]) => {
        const pct = ((amt / totalSpent) * 100).toFixed(0);
        summaryParts.push(`- ${cat}: ${amt.toLocaleString('vi-VN')}đ (${pct}%)`);
      });
    } else {
      summaryParts.push("Người dùng chưa ghi nhận bất kỳ giao dịch chi tiêu nào trong sổ tay tháng này.");
    }
    const summaryText = summaryParts.join('\n');

    try {
      const promptText = `Hãy phân tích dữ liệu chi tiêu này của người dùng:\n${summaryText}\n\nHãy phản hồi với dữ liệu dạng JSON.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          systemInstruction: "Bạn là một nhà biên tập cuốn sổ tay tài chính cổ điển Tachi. Hãy phân tích dữ liệu chi tiêu này của người dùng. Hãy đặt tên cho họ một 'Hình mẫu tài chính' hoài cổ (ví dụ: Học giả tiết kiệm, Kẻ lãng mạn hoang phí, Nhà giả kim cân bằng...). Sau đó, viết một bức thư tay chiêm nghiệm, tinh tế, có chiều sâu (khoảng 150-200 từ) bằng văn phong Vintage hoài niệm Việt Nam mộc mạc, nhẹ nhàng khuyên nhủ hoặc khích lệ họ điều chỉnh dòng tiền. Định dạng kết quả trả về dạng JSON chứa đúng 2 trường: archetype và letter.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              archetype: {
                type: Type.STRING,
                description: "Tên hình mẫu tài chính hoài cổ bằng Tiếng Việt (e.g., Học giả tiết kiệm, Kẻ lãng mạn lữ hành, Nhà giả kim cân bằng...)"
              },
              letter: {
                type: Type.STRING,
                description: "Nội dung bức thư chiêm nghiệm chân thành bằng Tiếng Việt phong cách Vintage sâu lắng (150-200 từ)."
              }
            },
            required: ["archetype", "letter"]
          }
        }
      });

      if (geminiResponse && geminiResponse.text) {
        const parsed = JSON.parse(geminiResponse.text.trim());
        if (parsed && parsed.archetype && parsed.letter) {
          return res.json({
            archetypeId: parsed.archetype,
            archetypeName: parsed.archetype,
            archetypeTitle: parsed.archetype,
            letter: parsed.letter,
            meters: {
              savings: fillSavings,
              impulsive: fillImpulsive,
              balanced: fillBalanced
            }
          });
        }
      }
    } catch (aiErr) {
      console.error("Gemini context generation failed, fallback to program rules:", aiErr);
    }

    res.json({
      archetypeId,
      archetypeName,
      archetypeTitle: archetypeTitleValue,
      letter: letterContent,
      meters: {
        savings: fillSavings,
        impulsive: fillImpulsive,
        balanced: fillBalanced
      }
    });
  } catch (error) {
    console.error('Failed to calculate intelligence insights:', error);
    res.status(500).json({ error: 'Server error processing intelligence analytical metrics.' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, category, note, mood, type } = req.body;
    if (amount === undefined || !category) {
      return res.status(400).json({ error: 'Amount and category are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    const normalizedCategory = category.trim();

    const newTransaction = {
      id: `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: Number(amount),
      category: normalizedCategory,
      note: (note || '').trim(),
      date: new Date().toISOString().split('T')[0],
      mood: mood || undefined,
      type: type || 'expense' // By default manual transaction entries are expenses
    };

    if (!userRecord.transactions) {
      userRecord.transactions = [];
    }

    userRecord.transactions.unshift(newTransaction);
    await writeData(data);
    
    res.json(userRecord.transactions);
  } catch (error) {
    console.error('Failed to add transaction:', error);
    res.status(500).json({ error: 'Server error adding transaction.' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, budget } = req.body;
    if (!name || budget === undefined) {
      return res.status(400).json({ error: 'Category name and budget limit are required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.categories) {
      userRecord.categories = [
        { name: "Groceries", budget: 3000000 },
        { name: "Coffee & Dining", budget: 1500000 },
        { name: "Investments", budget: 2000000 }
      ];
    }

    const cleanName = name.trim();
    if (!cleanName) {
      return res.status(400).json({ error: 'Category name cannot be empty.' });
    }

    const exists = userRecord.categories.some((c: any) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    const newCategory = { name: cleanName, budget: Number(budget) };
    userRecord.categories.push(newCategory);

    await writeData(data);
    res.json({ categories: userRecord.categories });
  } catch (error) {
    console.error('Failed to add category:', error);
    res.status(500).json({ error: 'Server error adding category.' });
  }
});

app.delete('/api/categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const data = await readData();
    const username = getAuthenticatedUser(req, data);
    if (!username) return unauthorized(res);

    const userRecord = data.users[username];
    if (!userRecord.categories) {
      userRecord.categories = [
        { name: "Groceries", budget: 3000000 },
        { name: "Coffee & Dining", budget: 1500000 },
        { name: "Investments", budget: 2000000 }
      ];
    }

    const targetName = name.trim();
    // Remove from user categories
    userRecord.categories = userRecord.categories.filter((c: any) => c.name.toLowerCase() !== targetName.toLowerCase());

    // Update matching transactions to "Uncategorized"
    userRecord.transactions = (userRecord.transactions || []).map((t: any) => {
      if (t.category && t.category.toLowerCase() === targetName.toLowerCase()) {
        return { ...t, category: 'Uncategorized' };
      }
      return t;
    });

    await writeData(data);
    res.json({ categories: userRecord.categories, transactions: userRecord.transactions });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Server error deleting category.' });
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
    if (!userRecord.categories) {
      userRecord.categories = [
        { name: "Groceries", budget: 3000000 },
        { name: "Coffee & Dining", budget: 1500000 },
        { name: "Investments", budget: 2000000 }
      ];
    }

    const targetName = name.trim();
    const catIndex = userRecord.categories.findIndex((c: any) => c.name.toLowerCase() === targetName.toLowerCase());
    if (catIndex === -1) {
      return res.status(404).json({ error: `Category "${name}" not found.` });
    }

    userRecord.categories[catIndex].budget = Number(budget);

    await writeData(data);
    res.json({ categories: userRecord.categories });
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Server error updating category.' });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
