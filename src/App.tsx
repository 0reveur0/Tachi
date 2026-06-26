import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen } from 'lucide-react';

type ScreenState = 'landing' | 'auth' | 'dashboard';
type TabState = 'budget' | 'transactions' | 'intelligence';

// Import newly created modular dashboard sub-views
import { Sidebar } from './components/Sidebar';
import { Overview } from './components/Overview';
import { Ledger } from './components/Ledger';
import { Jars } from './components/Jars';
import { Automation } from './components/Automation';
import { Intelligence } from './components/Intelligence';
import { FreedomCalculator } from './components/FreedomCalculator';

interface Profile {
  nickname: string;
  avatarUrl: string;
  bio: string;
}

interface Category {
  name: string;
  budget: number;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  mood?: 'impulsive' | 'essential' | 'joy';
  type?: 'expense' | 'income';
}

interface RecurringRule {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  name: string;
  dayOfMonth: number;
  category?: string;
}

interface FinancialData {
  categories: Category[];
  transactions: Transaction[];
  profile?: Profile;
  recurringRules?: RecurringRule[];
}

export default function App() {
  // Navigation screen router state
  const [screen, setScreen] = useState<ScreenState>('landing');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Dashboard Left Sidebar Navigation View state
  const [activeView, setActiveView] = useState<'overview' | 'ledger' | 'jars' | 'automation' | 'intelligence' | 'calculator'>('overview');

  // Automated recurring rule active toggles
  const [disabledRuleIds, setDisabledRuleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tachi_disabled_rules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleRule = (ruleId: string) => {
    setDisabledRuleIds(prev => {
      const updated = prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId) 
        : [...prev, ruleId];
      localStorage.setItem('tachi_disabled_rules', JSON.stringify(updated));
      return updated;
    });
  };

  // Magic link states
  const [email, setEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSuccess, setMagicLinkSuccess] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [generatedLinkForTesting, setGeneratedLinkForTesting] = useState<string | null>(null);

  // Core financial values
  const [data, setData] = useState<FinancialData>({
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
    recurringRules: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form entries states
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Groceries');
  const [note, setNote] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<'impulsive' | 'essential' | 'joy'>('essential');
  const [submitting, setSubmitting] = useState(false);

  // Automation / Recurring rule creation states
  const [recType, setRecType] = useState<'expense' | 'income'>('expense');
  const [recAmount, setRecAmount] = useState<string>('');
  const [recName, setRecName] = useState<string>('');
  const [recDay, setRecDay] = useState<number>(15);
  const [recCategory, setRecCategory] = useState<string>('Groceries');

  // Interactive search & filter states for the Ledger history log
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [newCatCycle, setNewCatCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [ledgerTxType, setLedgerTxType] = useState<'expense' | 'income'>('expense');

  // New category inputs for Add Category Form
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatBudget, setNewCatBudget] = useState<string>('');

  // Inline dynamic edit states for individual category budget
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editingBudgetVal, setEditingBudgetVal] = useState<string>('');

  // Profile Edit fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileNickname, setProfileNickname] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileBio, setProfileBio] = useState('');

  // Simple feedback row at top of notebook dashboard
  const [statusMessage, setStatusMessage] = useState<string>('Tracked with intention.');

  // Archetype intelligence state
  const [intelligenceData, setIntelligenceData] = useState<{
    summary: string;
    archetype: string;
    letter: string;
    meters: {
      savings: number;
      impulsive: number;
      balanced: number;
    };
  } | null>(null);

  const [intelligenceLoading, setIntelligenceLoading] = useState(false);

  // Time-Travel Freedom Calculator State
  const [calcMonthlyExpense, setCalcMonthlyExpense] = useState<string>('5000000');
  const [calcInflation, setCalcInflation] = useState<string>('4');
  const [calcYears, setCalcYears] = useState<string>('15');

  const fetchIntelligence = async () => {
    setIntelligenceLoading(true);
    try {
      const response = await fetch('/api/user/intelligence', {
        headers: getHeaders()
      });
      if (response.ok) {
        const res = await response.json();
        setIntelligenceData(res);
      }
    } catch (err) {
      console.error("Error drawing intelligence:", err);
    } finally {
      setIntelligenceLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'intelligence' && (currentUser || localStorage.getItem('tachi_session'))) {
      fetchIntelligence();
    }
  }, [activeView, data.transactions, currentUser]);

  // Fetch user profile based on Magic Link or saved token
  const fetchUserProfile = async (tokenValue: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenValue}`
        }
      });
      if (!response.ok) {
        throw new Error('Authorized session has expired.');
      }
      const result = await response.json();
      setCurrentUser(result.email);
      setData(result);
      
      setScreen('dashboard');
      setError(null);
    } catch (err: any) {
      localStorage.removeItem('tachi_session');
      setCurrentUser(null);
      setScreen('landing');
      setError(err.message || 'Auto-login error.');
    } finally {
      setLoading(false);
    }
  };

  // Validate active login credentials on boot and detect URL Magic Links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('auth_token');

    if (token) {
      localStorage.setItem('tachi_session', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchUserProfile(token);
    } else {
      const savedToken = localStorage.getItem('tachi_session');
      if (savedToken) {
        fetchUserProfile(savedToken);
      } else {
        setScreen('landing');
      }
    }
  }, []);

  // Request authorization headers helper
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const savedToken = localStorage.getItem('tachi_session');
    if (savedToken) {
      headers['Authorization'] = `Bearer ${savedToken}`;
    } else if (currentUser) {
      headers['Authorization'] = `Bearer ${currentUser}`;
    }
    return headers;
  };

  // Scroll to a specified section on the landing page
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Synchronise dashboard metrics
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data', {
        headers: getHeaders()
      });
      if (!response.ok) {
        if (response.status === 401) {
          handleSignOut();
          throw new Error('Authorized session has expired.');
        }
        throw new Error('Failed to retrieve ledger entries.');
      }
      const result: FinancialData = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Connecting error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('tachi_session') && screen === 'dashboard') {
      fetchUserData();
    }
  }, [screen]);

  // Auth Operations - Magic Link Post request
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMagicLinkError('Please enter your email address.');
      return;
    }

    setMagicLinkLoading(true);
    setMagicLinkError(null);
    setMagicLinkSuccess(false);
    setGeneratedLinkForTesting(null);

    try {
      // Connect to passwordless Magic Link dispatch API
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase()
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Requesting magic link failed.');
      }

      setMagicLinkSuccess(true);
      if (resData.magicLink) {
        setGeneratedLinkForTesting(resData.magicLink);
      }
    } catch (err: any) {
      setMagicLinkError(err.message || 'Connecting system failed.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('tachi_session');
    setCurrentUser(null);
    setData({
      categories: [
        { name: "Groceries", budget: 3000000 },
        { name: "Coffee & Dining", budget: 1500000 },
        { name: "Investments", budget: 2000000 }
      ],
      transactions: [],
      recurringRules: []
    });
    setEmail('');
    setMagicLinkSuccess(false);
    setGeneratedLinkForTesting(null);
    setScreen('landing');
  };

  // Add ledger entry
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amount);
    if (!amount || isNaN(cleanAmount) || cleanAmount <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: cleanAmount,
          category: ledgerTxType === 'income' ? 'Uncategorized' : category,
          note: note.trim() || category,
          mood: selectedMood,
          type: ledgerTxType
        })
      });

      if (!response.ok) throw new Error('Could not record entry.');
      const updatedTransactions = await response.json();
      
      setData(prev => ({
        ...prev,
        transactions: updatedTransactions
      }));

      setAmount('');
      setNote('');
      setStatusMessage('Tracked with intention.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting system failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add direct dynamic recurring rule
  const handleCreateRecurringRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(recAmount);
    if (!recName.trim() || !recAmount || isNaN(cleanAmount) || cleanAmount <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: recType,
          amount: cleanAmount,
          name: recName.trim(),
          dayOfMonth: Number(recDay),
          category: recType === 'income' ? 'Uncategorized' : recCategory
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not instantiate recurring rule.');
      }

      setData(prev => ({
        ...prev,
        recurringRules: resData.recurringRules,
        transactions: resData.transactions || prev.transactions
      }));

      setRecName('');
      setRecAmount('');
      setStatusMessage('Automation rule planted with security.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'System error on automation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Discard direct dynamic recurring rule
  const handleDeleteRecurringRule = async (id: string) => {
    try {
      const response = await fetch(`/api/recurring/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not discard recurring rule.');
      }

      setData(prev => ({
        ...prev,
        recurringRules: resData.recurringRules
      }));
      setStatusMessage('Discarded automation rule successfully.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting system failed.');
    }
  };

  // Add new dynamic budget category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatBudget || isNaN(Number(newCatBudget))) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newCatName.trim(),
          budget: Number(newCatBudget)
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not add dynamic category.');
      }

      setData(prev => ({
        ...prev,
        categories: resData.categories
      }));

      setNewCatName('');
      setNewCatBudget('');
      setStatusMessage('Jar planted with abundance.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'System error on category allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category and fallback its sub-transactions to "Uncategorized"
  const handleDeleteCategory = async (catName: string) => {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(catName)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not discard category.');
      }

      setData(prev => ({
        ...prev,
        categories: resData.categories,
        transactions: resData.transactions
      }));
      
      // Auto adjust selected category dropdown if needed
      if (category === catName) {
        const nextCat = resData.categories[0]?.name || 'Uncategorized';
        setCategory(nextCat);
      }

      setStatusMessage('Closed dynamic jar completely.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Category removal failed.');
    }
  };

  // Update specific category budget limit
  const handleUpdateCategoryBudget = async (catName: string, newLimit: number) => {
    if (isNaN(newLimit) || newLimit < 0) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: catName,
          budget: newLimit
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not save new ceiling.');
      }

      setData(prev => ({
        ...prev,
        categories: resData.categories
      }));

      setEditingCategoryName(null);
      setStatusMessage('Ceiling realigned.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Limit adjustment failed.');
    }
  };

  // Update Profile details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          nickname: profileNickname,
          avatarUrl: profileAvatarUrl,
          bio: profileBio
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not update profile.');
      }

      setData(prev => ({
        ...prev,
        profile: resData.profile
      }));

      setIsEditingProfile(false);
      setStatusMessage('Journals updated with recognition.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Profile save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sync profile fields from backend representation
  useEffect(() => {
    if (data.profile) {
      setProfileNickname(data.profile.nickname || '');
      setProfileAvatarUrl(data.profile.avatarUrl || '');
      setProfileBio(data.profile.bio || '');
    }
  }, [data.profile]);

  // Discard ledger item
  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Discarding transaction process error.');
      const updatedTransactions = await response.json();

      setData(prev => ({
        ...prev,
        transactions: updatedTransactions
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Summary stats helper for dynamic categories
  const spendingSummary = useMemo(() => {
    const totals: Record<string, number> = {};
    if (data.categories) {
      data.categories.forEach(c => {
        totals[c.name.toLowerCase()] = 0;
      });
    }
    if (data.transactions) {
      data.transactions.forEach(t => {
        // Only count expenses towards category spend
        if (t.type !== 'income') {
          const catKey = (t.category || '').toLowerCase();
          if (totals[catKey] === undefined) {
            totals[catKey] = 0;
          }
          totals[catKey] += t.amount;
        }
      });
    }
    return totals;
  }, [data.categories, data.transactions]);

  // Financial Intelligence analytics calculations
  const intelligenceMetrics = useMemo(() => {
    const transactions = data.transactions || [];
    const categories = data.categories || [];
    const recurring = data.recurringRules || [];

    // 1. Mood breakdown for outflows
    let totalSpentWithMoods = 0;
    const moodBreakdown = {
      essential: 0,
      joy: 0,
      impulsive: 0
    };

    transactions.forEach(t => {
      if (t.type !== 'income') {
        const amt = Number(t.amount) || 0;
        totalSpentWithMoods += amt;
        
        if (t.mood && t.mood in moodBreakdown) {
          moodBreakdown[t.mood] += amt;
        } else {
          moodBreakdown.essential += amt;
        }
      }
    });

    // 2. Budget status
    const totalBudget = categories.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
    const balanceRemaining = Math.max(0, totalBudget - totalSpentWithMoods);

    // 3. Recurring stats
    const monthlyIncome = recurring
      .filter(r => r.type === 'income' && !disabledRuleIds.includes(r.id))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const monthlyExpense = recurring
      .filter(r => r.type === 'expense' && !disabledRuleIds.includes(r.id))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const netMonthly = monthlyIncome - monthlyExpense;
    const projectedSixMonths = netMonthly * 6;
    const projectedEndYear = netMonthly * 12;

    return {
      totalSpentWithMoods,
      moodBreakdown,
      totalBudget,
      balanceRemaining,
      monthlyIncome,
      monthlyExpense,
      netMonthly,
      projectedSixMonths,
      projectedEndYear
    };
  }, [data, disabledRuleIds]);

  // English monetary values helper
  const formatCurrency = (val: number) => {
    try {
      return `${new Intl.NumberFormat('vi-VN').format(Math.abs(val))} đ`;
    } catch {
      return `${val.toLocaleString()} đ`;
    }
  };

  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex flex-col bg-[#FDFBF7] text-[#2D3B32] font-sans antialiased selection:bg-[#CCD8CB] selection:text-[#2D3B32] transition-colors duration-500 ${
      screen === 'landing' || screen === 'dashboard' ? 'p-0' : 'py-8 px-4 md:px-8'
    }`}>
      
      {/* -------------------- SCREEN 1: LANDING -------------------- */}
      {screen === 'landing' && (
        <main className="min-h-screen w-full overflow-x-hidden flex flex-col bg-[#FDFBF7]" id="landing-screen">
          
          {/* Header (Sticky Navigation) */}
          <nav className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#2D3B32]/10 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
            <span className="font-serif text-2xl font-normal text-[#2D3B32] select-none lowercase">
              tachi.
            </span>
            <button 
              onClick={() => setScreen('auth')}
              className="text-[10px] sm:text-xs uppercase font-extrabold tracking-[0.2em] text-[#2D3B32] hover:text-[#8FA88B] transition-colors duration-300 border-b border-dashed border-[#2D3B32]/40 pb-0.5 cursor-pointer"
            >
              [ Sign In ]
            </button>
          </nav>

          {/* Section 1: The Cover (Trang bia - Chiem tron 100vh) */}
          <section className="relative min-h-[calc(100vh-68px)] flex flex-col justify-center items-center text-center px-4 md:px-8 bg-[#FDFBF7] overflow-hidden" id="landing-cover">
            
            {/* Elegant botanical fern sticker in bottom right */}
            <svg className="absolute bottom-6 right-6 w-36 h-36 md:bottom-10 md:right-10 md:w-48 md:h-48 pointer-events-none rotate-12 text-[#2D3B32]/10 md:text-[#2D3B32]/15 fill-none select-none z-0" viewBox="0 0 100 100" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {/* Main curved stem */}
              <path d="M 20,90 Q 55,55 80,10" />
              {/* Left & Right leaflets */}
              <path d="M 30,73 C 25,75 15,70 12,65 C 10,61 14,58 22,62" />
              <path d="M 32,71 C 38,73 45,70 48,65 C 50,61 46,58 38,62" />
              <path d="M 40,58 C 32,58 22,50 18,44 C 16,40 22,37 31,43" />
              <path d="M 42,56 C 50,58 60,50 64,44 C 66,40 60,37 51,43" />
              <path d="M 49,43 C 41,43 32,34 29,28 C 27,24 32,21 41,27" />
              <path d="M 51,41 C 59,43 68,34 71,28 C 73,24 68,21 59,27" />
              <path d="M 58,28 C 52,28 45,21 43,15 C 41,11 45,9 51,15" />
              <path d="M 59,27 C 65,28 72,21 74,15 C 76,11 72,9 66,15" />
              <path d="M 67,16 Q 60,10 68,5 Q 75,10 68,15" />
            </svg>

            <div className="space-y-6 max-w-2xl mx-auto py-12 relative z-10">
              <span className="text-[10px] tracking-[0.25em] text-[#2D3B32]/40 uppercase font-extrabold block">
                welcome to simplicity
              </span>
              
              <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-normal text-[#2D3B32] tracking-tighter lowercase select-none">
                tachi.
              </h1>
              
              <p className="font-serif text-lg sm:text-xl text-[#2D3B32]/75 italic leading-relaxed max-w-md sm:max-w-xl mx-auto">
                "An analog financial journal for the digital minimalist."
              </p>

              <div className="pt-10">
                <button
                  onClick={() => scrollToSection('landing-philosophy')}
                  className="group bg-[#6B8467] hover:bg-[#4E634A] text-[#FDFBF7] font-medium text-xs font-semibold uppercase tracking-[0.15em] px-8 py-3.5 rounded-lg transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0 border border-[#6B8467] shadow-sm hover:shadow-md"
                >
                  <span>Begin Your Journey</span>
                  <span className="text-xs group-hover:translate-y-1 transition-transform duration-300">↓</span>
                </button>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-[#2D3B32]/30 animate-pulse hidden sm:block">
              Scroll down to explore
            </div>
          </section>

          {/* Section 2: The Philosophy */}
          <section className="min-h-[80vh] flex flex-col justify-center py-24 border-t border-dashed border-[#2D3B32]/20 px-4 md:px-8 bg-[#FDFBF7]" id="landing-philosophy">
            <div className="max-w-4xl mx-auto w-full">
              
              <div className="text-center space-y-2 mb-16">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8FA88B] block">
                  Our core architecture
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#2D3B32] font-normal italic lowercase">
                  Three Buckets. Clear Mind.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                
                {/* Bucket 1: Essential */}
                <div className="space-y-4 p-8 bg-[#EFECE6]/25 border border-[#2D3B32]/10 rounded-xl hover:border-[#8FA88B]/30 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="font-serif italic text-[#8FA88B] text-2xl font-bold">01.</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#2D3B32]/40 font-mono">Needs</span>
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-[#8FA88B] mb-2 lowercase pb-1 border-b border-[#2D3B32]/5">
                      Essential
                    </h3>
                    <p className="text-xs text-[#2D3B32]/75 leading-relaxed font-sans">
                      The foundation. For your needs, your survival, and your stability.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-[#2D3B32]/40 pt-4 block border-t border-dashed border-[#2D3B32]/10">Stable Roots</span>
                </div>

                {/* Bucket 2: Enjoyment */}
                <div className="space-y-4 p-8 bg-[#EFECE6]/25 border border-[#2D3B32]/10 rounded-xl hover:border-[#8FA88B]/30 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="font-serif italic text-[#8FA88B] text-2xl font-bold">02.</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#2D3B32]/40 font-mono">Joy</span>
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-[#8FA88B] mb-2 lowercase pb-1 border-b border-[#2D3B32]/5">
                      Enjoyment
                    </h3>
                    <p className="text-xs text-[#2D3B32]/75 leading-relaxed font-sans">
                      The guilt-free space. For your coffee, your travels, and your small joys.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-[#2D3B32]/40 pt-4 block border-t border-dashed border-[#2D3B32]/10">Present Bloom</span>
                </div>

                {/* Bucket 3: Savings */}
                <div className="space-y-4 p-8 bg-[#EFECE6]/25 border border-[#2D3B32]/10 rounded-xl hover:border-[#8FA88B]/30 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="font-serif italic text-[#8FA88B] text-2xl font-bold">03.</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#2D3B32]/40 font-mono">Security</span>
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-[#8FA88B] mb-2 lowercase pb-1 border-b border-[#2D3B32]/5">
                      Savings
                    </h3>
                    <p className="text-xs text-[#2D3B32]/75 leading-relaxed font-sans">
                      The future self. For your peace of mind and long-term freedom.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-[#2D3B32]/40 pt-4 block border-t border-dashed border-[#2D3B32]/10">Freedom seeds</span>
                </div>

              </div>

              <div className="text-center pt-16">
                <button 
                  onClick={() => scrollToSection('landing-how-it-works')}
                  className="text-[#2D3B32]/60 hover:text-[#2D3B32] text-xs font-bold uppercase tracking-widest border-b border-[#2D3B32]/20 pb-1 transition-colors duration-200 cursor-pointer"
                >
                  How it works →
                </button>
              </div>

            </div>
          </section>

          {/* Section 3: How It Works */}
          <section className="min-h-[80vh] flex flex-col justify-center py-24 border-t border-dashed border-[#2D3B32]/25 px-4 md:px-8 bg-[#FDFBF7]" id="landing-how-it-works">
            <div className="max-w-4xl mx-auto w-full">
              
              <div className="text-center space-y-2 mb-16">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8FA88B] block">
                  Methodology
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#2D3B32] font-normal italic lowercase">
                  Three simple steps to financial clarity
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
                
                {/* Step 1 */}
                <div className="space-y-4 p-8 bg-[#EFECE6]/15 border border-[#2D3B32]/10 rounded-xl relative hover:border-[#8FA88B]/30 transition-all duration-300">
                  <div className="font-serif text-4xl text-[#8FA88B]/60 font-bold mb-2">01 /</div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D3B32] border-b border-[#2D3B32]/10 pb-1.5 font-sans">Set Limits</h4>
                  <p className="text-xs text-[#2D3B32]/75 leading-relaxed font-sans">
                    Define your monthly boundaries for Essential, Enjoyment, and Savings.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-4 p-8 bg-[#EFECE6]/15 border border-[#2D3B32]/10 rounded-xl relative hover:border-[#8FA88B]/30 transition-all duration-300">
                  <div className="font-serif text-4xl text-[#8FA88B]/60 font-bold mb-2">02 /</div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D3B32] border-b border-[#2D3B32]/10 pb-1.5 font-sans">Reflect & Log</h4>
                  <p className="text-xs text-[#2D3B32]/75 leading-relaxed font-sans">
                    Take 1 minute at the end of the day to manually write down your spendings.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-4 p-8 bg-[#EFECE6]/15 border border-[#2D3B32]/10 rounded-xl relative hover:border-[#8FA88B]/30 transition-all duration-300">
                  <div className="font-serif text-4xl text-[#8FA88B]/60 font-bold mb-2">03 /</div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D3B32] border-b border-[#2D3B32]/10 pb-1.5 font-sans">Flow Naturally</h4>
                  <p className="text-xs text-[#2D3B32]/75 leading-relaxed font-sans">
                    Watch your cash flow update visually without any complex financial jargon.
                  </p>
                </div>

              </div>

              <div className="text-center pt-16">
                <button 
                  onClick={() => scrollToSection('landing-manifest')}
                  className="text-[#2D3B32]/60 hover:text-[#2D3B32] text-xs font-bold uppercase tracking-widest border-b border-[#2D3B32]/20 pb-1 transition-colors duration-200 cursor-pointer"
                >
                  Read our manifest →
                </button>
              </div>

            </div>
          </section>

          {/* Section 4: The Manifest & CTA */}
          <section className="min-h-[70vh] flex flex-col justify-center items-center bg-[#8FA88B]/5 py-20 px-8 text-center border-t border-dashed border-[#2D3B32]/25" id="landing-manifest">
            <div className="max-w-3xl mx-auto space-y-8">
              
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#2D3B32]/50 block">The Manifesto</span>
                <h2 className="font-serif text-3xl md:text-4xl text-[#2D3B32] font-normal lowercase">the minimalist commitment</h2>
              </div>

              <div className="bg-[#EFECE6]/15 border border-[#2D3B32]/10 p-8 md:p-14 rounded-2xl relative transition-all duration-300 shadow-sm">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#FDFBF7] px-4 font-serif text-[#8FA88B] text-4xl select-none italic">❧</span>
                
                <div className="flex justify-center mb-6 pointer-events-none select-none">
                  <svg className="w-10 h-10 text-[#8FA88B]/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M 50 20 C 45 35, 55 35, 50 20 Z" />
                    <path d="M 50 20 C 35 25, 40 45, 50 20 Z" />
                    <path d="M 50 20 C 65 25, 60 45, 50 20 Z" />
                    <path d="M 50 20 C 50 45, 30 40, 50 20 Z" />
                    <path d="M 50 20 C 50 45, 70 40, 50 20 Z" />
                    <path d="M 50 40 Q 52 65 48 90" />
                    <path d="M 50 60 Q 38 52 35 45 Q 42 55 50 60 Z" />
                    <path d="M 50 70 Q 62 62 65 55 Q 58 65 50 70 Z" />
                  </svg>
                </div>

                <p className="font-serif text-base sm:text-lg md:text-xl text-[#2D3B32]/85 italic leading-relaxed max-w-2xl mx-auto">
                  "We believe that managing money shouldn't feel like a high-tech game with flashing alerts. It should feel like sitting down with a cup of warm tea, picking up a pen, and intentionally writing down where your life flows. No automated syncs. No stress. Just you and your choices."
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setScreen('auth')}
                  className="bg-[#6B8467] text-[#FDFBF7] font-medium text-xs font-bold uppercase tracking-[0.2em] px-8 py-3.5 rounded-lg mt-4 inline-block hover:bg-[#4E634A] transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer border border-[#6B8467]"
                  id="open-journal-button"
                >
                  [ Open Your Journal ]
                </button>
              </div>

              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#2D3B32]/35 pb-2">
                Conscious Accounting • Completely Private Local Data Storage
              </p>

            </div>
          </section>

          {/* Section 5: Editorial Footer */}
          <footer className="bg-[#2D3B32] text-[#FDFBF7]/70 py-16 px-12 border-t border-[#8FA88B]/20" id="landing-big-footer">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[#FDFBF7]/10">
              
              <div className="space-y-4 md:pr-8">
                <h3 className="font-serif text-2xl text-[#FDFBF7] font-normal lowercase select-none">
                  tachi.
                </h3>
                <p className="text-xs text-[#FDFBF7]/60 leading-relaxed max-w-sm">
                  A mindful space for your numbers. Crafted with care and intention. © 2026 Tachi Studio.
                </p>
                <div className="text-[10px] font-mono text-[#FDFBF7]/40 pt-4 uppercase">
                  all rights reserved.
                </div>
              </div>

              <div className="space-y-4 pt-8 md:pt-0 md:pl-8 md:pr-8">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8FA88B] block font-sans">
                  [ INQUIRIES ]
                </span>
                <div className="space-y-2.5 text-xs text-[#FDFBF7]/70 font-mono">
                  <p>
                    <a href="mailto:reveur.btb@outlook.com" className="block hover:underline text-[#FDFBF7] transition-all duration-200">
                      reveur.btb@outlook.com
                    </a>
                  </p>
                  <p>
                    <a href="mailto:barelyhere.btb@gmail.com" className="block hover:underline text-[#FDFBF7] transition-all duration-200">
                      barelyhere.btb@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-8 md:pt-0 md:pl-8">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#8FA88B] block font-sans">
                  [ INDEX ]
                </span>
                <div className="space-y-2.5 text-xs text-[#FDFBF7]/70 font-mono">
                  <a href="#" onClick={(e) => e.preventDefault()} className="block hover:underline hover:text-[#8FA88B] transition-colors duration-200">
                    Privacy Policy
                  </a>
                  <a href="#" onClick={(e) => e.preventDefault()} className="block hover:underline hover:text-[#8FA88BB] transition-colors duration-200">
                    Terms of Journaling
                  </a>
                  <div className="pt-4 text-[10px] text-[#8FA88B] flex items-center gap-1.5 font-sans italic">
                    <span>❦</span>
                    <span>Analog living inside modern containers.</span>
                  </div>
                </div>
              </div>

            </div>
          </footer>

        </main>
      )}

      {/* -------------------- SCREEN 2: AUTHENTICATION -------------------- */}
      {screen === 'auth' && (
        <main className="min-h-screen flex flex-col justify-center items-center bg-[#FDFBF7] px-4 py-12" id="auth-screen">
          
          <div className="w-full max-w-md bg-[#FDFBF7] p-8 md:p-10 border border-[#2D3B32]/20 rounded-xl text-center space-y-6 relative hover:border-[#8FA88B]/40 transition-all duration-300 shadow-sm">
            
            <div className="absolute top-4 left-4">
              <button
                onClick={() => {
                  setScreen('landing');
                  setEmail('');
                  setMagicLinkSuccess(false);
                  setGeneratedLinkForTesting(null);
                  setMagicLinkError(null);
                }}
                className="text-[10px] uppercase font-bold tracking-widest text-[#2D3B32]/60 border border-[#2D3B32]/30 bg-transparent px-3 py-1.5 rounded-lg hover:bg-[#8FA88B]/10 hover:text-[#2D3B32] flex items-center gap-1.5 transition-all duration-300 select-none cursor-pointer"
                id="back-to-cover-top"
              >
                ← Back
              </button>
            </div>

            <div className="pt-6">
              <h2 className="font-serif text-3xl font-normal text-[#2D3B32] lowercase select-none">
                tachi.
              </h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8FA88B] mt-1 font-sans">
                Passwordless Journal Access
              </p>
            </div>

            {magicLinkError && (
              <div className="bg-[#6E7F6B]/10 text-[#2D3B32] p-3 rounded text-xs text-center border border-[#2D3B32]/20 font-mono">
                {magicLinkError}
              </div>
            )}

            {!magicLinkSuccess ? (
              <form onSubmit={handleSendMagicLink} className="space-y-6 pt-4 text-left">
                <div className="space-y-2">
                  <label htmlFor="email-input" className="block text-[10px] uppercase font-bold tracking-widest text-[#2D3B32]/60 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center border-b border-[#2D3B32]/30 focus-within:border-[#8FA88B] py-2 transition-all duration-300">
                    <input
                      type="email"
                      id="email-input"
                      required
                      placeholder="Enter your email to receive log in link..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-[#2D3B32] focus:outline-none placeholder-[#2D3B32]/25 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={magicLinkLoading}
                    className="w-full bg-[#6B8467] text-[#FDFBF7] font-medium text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg transition-all duration-300 hover:bg-[#4E634A] border border-[#6B8467] hover:-translate-y-0.5 shadow-sm hover:shadow-md cursor-pointer"
                    id="send-magic-link-btn"
                  >
                    {magicLinkLoading ? 'Sending...' : '[ Send Magic Link ]'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 py-6 text-center animate-fade-in">
                
                <div className="w-16 h-16 bg-[#8FA88B]/10 rounded-full mx-auto flex items-center justify-center text-[#8FA88B]" id="envelope-carrier">
                  <BookOpen className="w-8 h-8" />
                </div>

                <div className="px-2 space-y-3">
                  <h3 className="font-serif italic text-lg text-[#2D3B32] font-semibold">
                    The envelope has been dispatched.
                  </h3>
                  <p className="text-xs text-[#2D3B32]/75 leading-relaxed italic font-sans max-w-sm mx-auto">
                    A digital letter containing your access link has been sent to your email. Please check your inbox (or spam folder) and click the link to open your journal.
                  </p>
                </div>

                {generatedLinkForTesting && (
                  <div className="mt-6 p-4 bg-[#8FA88B]/10 border border-[#8FA88B]/30 rounded-lg text-center" id="dev-simulated-box">
                    <p className="text-[9px] font-mono text-[#2D3B32]/60 mb-2 uppercase tracking-widest">[ Developer Preview Mode Shortcut ]</p>
                    <a
                      href={generatedLinkForTesting}
                      className="inline-block text-[11px] text-[#FDFBF7] bg-[#8FA88B] hover:bg-[#7A9476] font-bold py-2 px-5 rounded-lg transition-all duration-300 uppercase tracking-wider text-center"
                    >
                      Click here to simulate opening link
                    </a>
                    <p className="text-[8px] font-mono text-[#2D3B32]/40 mt-1.5 leading-normal">
                      (Simulates opening the emailed URL with authorization token)
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => setMagicLinkSuccess(false)}
                    className="text-xs text-[#2D3B32]/60 hover:text-[#2D3B32] underline hover:no-underline transition-colors duration-200"
                    id="retry-email-btn"
                  >
                    Use other email address
                  </button>
                </div>

              </div>
            )}

            <div className="pt-4 mt-4 border-t border-dashed border-[#2D3B32]/10 text-center text-[9px] uppercase tracking-widest text-[#2D3B32]/40 font-mono">
              Secure Ledger Isolation
            </div>

          </div>

          <button
            onClick={() => {
              setScreen('landing');
              setEmail('');
              setMagicLinkSuccess(false);
              setGeneratedLinkForTesting(null);
              setMagicLinkError(null);
            }}
            className="mt-8 text-xs text-[#2D3B32]/60 border border-[#2D3B32]/30 bg-transparent px-4 py-2 rounded-lg hover:bg-[#8FA88B]/10 hover:text-[#2D3B32] transition-all duration-300 cursor-pointer"
            id="back-to-cover-bottom"
          >
            ← Back to notebook cover
          </button>
        </main>
      )}

      {/* -------------------- SCREEN 3: VINTAGE TABBED JOURNAL NOTEBOOK -------------------- */}
      {screen === 'dashboard' && (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-[#FDFBF7]" id="dashboard-layout">
          {/* Left Sidebar navigation component */}
          <Sidebar
            currentUser={currentUser}
            data={data}
            activeView={activeView}
            setActiveView={setActiveView}
            handleSignOut={handleSignOut}
            isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile}
            profileNickname={profileNickname}
            setProfileNickname={setProfileNickname}
            profileAvatarUrl={profileAvatarUrl}
            setProfileAvatarUrl={setProfileAvatarUrl}
            profileBio={profileBio}
            setProfileBio={setProfileBio}
            handleUpdateProfile={handleUpdateProfile}
            submitting={submitting}
          />

          {/* Right Main content pane */}
          <main className="flex-1 min-w-0 p-6 md:p-12 bg-[#FDFBF7] overflow-y-auto relative flex flex-col justify-between animate-fade-in" id="dashboard-main-content">
            
            {/* Elegant botanical SVG sticker placed in strategic silent corners */}
            <div className="absolute top-10 right-10 w-48 h-48 pointer-events-none rotate-12 opacity-15 select-none text-[#2D3B32]/15 z-0">
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="M 50 90 C 50 65 50 35 50 10" />
                <path d="M 50 75 Q 35 65 30 55" />
                <path d="M 50 75 Q 65 65 70 55" />
                <path d="M 50 55 Q 30 45 25 35" />
                <path d="M 50 55 Q 70 45 75 35" />
                <path d="M 50 35 Q 35 25 30 15" />
                <path d="M 50 35 Q 75 25 70 15" />
              </svg>
            </div>

            <div className="space-y-8 flex-1 z-10">
              
              {/* Top notification banners */}
              {error && (
                <div className="p-4 bg-[#FDE8E4] border border-[#8E4A3E]/35 text-[#8E4A3E] text-xs rounded-xl flex justify-between items-center relative animate-fade-in shadow-xs" id="dashboard-error">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">❧</span>
                    <p className="font-serif italic text-justify">{error}</p>
                  </div>
                  <button 
                    onClick={() => setError(null)} 
                    className="p-1 text-[#8E4A3E]/60 hover:text-[#8E4A3E] font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Status desk row indicator */}
              {statusMessage && !error && (
                <div className="p-2 border-b border-dashed border-[#2D3B32]/8 flex items-baseline justify-between text-xs font-mono text-[#2D3B32]/45 animate-fade-in" id="dashboard-status-indicator">
                  <span className="uppercase tracking-widest text-[9px] font-bold">Cabinet Desk Status</span>
                  <span className="italic pr-2 font-serif text-[#2D3B32]/60">" {statusMessage} "</span>
                </div>
              )}

              {/* View Router */}
              {activeView === 'overview' && (
                <Overview
                  data={data}
                  formatCurrency={formatCurrency}
                  setActiveView={setActiveView}
                  intelligenceMetrics={intelligenceMetrics}
                />
              )}

              {activeView === 'ledger' && (
                <Ledger
                  data={data}
                  formatCurrency={formatCurrency}
                  amount={amount}
                  setAmount={setAmount}
                  category={category}
                  setCategory={setCategory}
                  note={note}
                  setNote={setNote}
                  selectedMood={selectedMood}
                  setSelectedMood={setSelectedMood}
                  ledgerTxType={ledgerTxType}
                  setLedgerTxType={setLedgerTxType}
                  handleAddTransaction={handleAddTransaction}
                  handleDeleteTransaction={handleDeleteTransaction}
                  submitting={submitting}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  catFilter={catFilter}
                  setCatFilter={setCatFilter}
                />
              )}

              {activeView === 'jars' && (
                <Jars
                  data={data}
                  formatCurrency={formatCurrency}
                  spendingSummary={spendingSummary}
                  newCatName={newCatName}
                  setNewCatName={setNewCatName}
                  newCatBudget={newCatBudget}
                  setNewCatBudget={setNewCatBudget}
                  newCatCycle={newCatCycle}
                  setNewCatCycle={setNewCatCycle}
                  handleCreateCategory={handleCreateCategory}
                  handleDeleteCategory={handleDeleteCategory}
                  editingCategoryName={editingCategoryName}
                  setEditingCategoryName={setEditingCategoryName}
                  editingBudgetVal={editingBudgetVal}
                  setEditingBudgetVal={setEditingBudgetVal}
                  handleUpdateCategoryBudget={handleUpdateCategoryBudget}
                />
              )}

              {activeView === 'automation' && (
                <Automation
                  data={data}
                  formatCurrency={formatCurrency}
                  recType={recType}
                  setRecType={setRecType}
                  recAmount={recAmount}
                  setRecAmount={setRecAmount}
                  recName={recName}
                  setRecName={setRecName}
                  recDay={recDay}
                  setRecDay={setRecDay}
                  recCategory={recCategory}
                  setRecCategory={setRecCategory}
                  handleAddRecurringRule={handleCreateRecurringRule}
                  handleDeleteRecurringRule={handleDeleteRecurringRule}
                  disabledRuleIds={disabledRuleIds}
                  handleToggleRule={handleToggleRule}
                  submitting={submitting}
                />
              )}

              {activeView === 'intelligence' && (
                <Intelligence
                  intelligenceLoading={intelligenceLoading}
                  intelligenceData={intelligenceData}
                  fetchIntelligence={fetchIntelligence}
                />
              )}

              {activeView === 'calculator' && (
                <FreedomCalculator
                  formatCurrency={formatCurrency}
                  calcMonthlyExpense={calcMonthlyExpense}
                  setCalcMonthlyExpense={setCalcMonthlyExpense}
                  calcInflation={calcInflation}
                  setCalcInflation={setCalcInflation}
                  calcYears={calcYears}
                  setCalcYears={setCalcYears}
                />
              )}

            </div>

            {/* So tay Footer guidelines and references (Purely offline-centric tone) */}
            <footer className="mt-16 border-t border-[#2D3B32]/15 pt-4 text-center text-[10px] text-[#2D3B32]/40 font-mono flex flex-col sm:flex-row justify-between uppercase tracking-widest gap-2 select-none z-10">
              <span>Tachi cash flow journal</span>
              <span>est. 2026 / simple organic wabi-sabi ethics</span>
            </footer>

          </main>
        </div>
      )}

    </div>
  );
}
