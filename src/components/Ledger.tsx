import React from 'react';
import { Plus, Download, Search, Trash2 } from 'lucide-react';

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

interface FinancialData {
  categories: Category[];
  transactions: Transaction[];
  profile: any;
  recurringRules: any[];
}

interface LedgerProps {
  data: FinancialData;
  formatCurrency: (value: number) => string;
  amount: string;
  setAmount: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  note: string;
  setNote: (val: string) => void;
  selectedMood: 'impulsive' | 'essential' | 'joy';
  setSelectedMood: (mood: 'impulsive' | 'essential' | 'joy') => void;
  ledgerTxType: 'expense' | 'income';
  setLedgerTxType: (type: 'expense' | 'income') => void;
  handleAddTransaction: (e: React.FormEvent) => void;
  handleDeleteTransaction: (id: string) => void;
  submitting: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  catFilter: string;
  setCatFilter: (val: string) => void;
}

export const Ledger: React.FC<LedgerProps> = ({
  data,
  formatCurrency,
  amount,
  setAmount,
  category,
  setCategory,
  note,
  setNote,
  selectedMood,
  setSelectedMood,
  ledgerTxType,
  setLedgerTxType,
  handleAddTransaction,
  handleDeleteTransaction,
  submitting,
  searchTerm,
  setSearchTerm,
  catFilter,
  setCatFilter,
}) => {
  // Filter transactions dynamically
  const filteredTransactions = (data.transactions || []).filter((t) => {
    const matchesSearch = (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = catFilter === 'all' || 
                            t.category.toLowerCase() === catFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Ghi chu (Memo)", "Phan loai (Category)", "So tien (VND)", "Cam xuc (Mood)", "Loai (Type)", "Ngay (Date)"];
    const rows = (data.transactions || []).map(t => [
      t.id,
      t.note || '',
      t.category,
      t.amount,
      t.mood || 'none',
      t.type || 'expense',
      t.date || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tachi_ledger_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      {/* Page Title Header */}
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">Manual Bookkeeping</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Visual Ledger & Bookkeeping / Sổ Ghi Chép Cảm Xúc ✦
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (manual entry form) */}
        <div className="lg:col-span-5 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Classic Form Entry</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5 font-serif">Inscribe manual logs into the ink journal</p>
          </div>

          <form onSubmit={handleAddTransaction} className="space-y-5">
            {/* Outflow / Inflow Toggle Switch */}
            <div className="space-y-1.5">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Transaction Sector / Loại giao dịch
              </label>
              <div className="flex bg-[#E2EAE0]/50 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLedgerTxType('expense')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    ledgerTxType === 'expense'
                      ? 'bg-[#E54B4B] text-[#FDFBF7] shadow-sm'
                      : 'text-[#2D3B32]/65 hover:text-[#2D3B32]'
                  }`}
                >
                  🔴 Chi Tiêu (-)
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerTxType('income')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    ledgerTxType === 'income'
                      ? 'bg-[#6B8467] text-[#FDFBF7] shadow-sm'
                      : 'text-[#2D3B32]/65 hover:text-[#2D3B32]'
                  }`}
                >
                  🟢 Thu Nhập (+)
                </button>
              </div>
            </div>

            {/* Amount input designed like a premium bank check */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Amount / Số tiền (VND)
              </label>
              <div className="flex items-baseline border-b border-[#2D3B32]/20 focus-within:border-[#6B8467] py-2 transition-all">
                <span className="font-serif text-lg text-[#2D3B32]/50 select-none mr-2">đ</span>
                <input
                  type="number"
                  required
                  min="100"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent border-none text-xl text-[#2D3B32] font-semibold font-mono focus:outline-none placeholder-[#2D3B32]/10"
                  id="amount-input"
                />
              </div>
            </div>

            {/* Category select */}
            {ledgerTxType === 'expense' && (
              <div className="space-y-1.5">
                <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                  Assigned Budget Jar / Bình ngân sách
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-[#6B8467] cursor-pointer"
                  id="category-selector"
                >
                  {(data.categories || []).map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} (Limit: {formatCurrency(cat.budget)})
                    </option>
                  ))}
                  <option value="Uncategorized">Uncategorized</option>
                </select>
              </div>
            )}

            {/* Psychological mood selectors */}
            <div className="space-y-1.5">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Emotional Mood / Tâm lý chi tiêu
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'essential', label: '🏠 Essential', desc: 'Thiết yếu' },
                  { value: 'joy', label: '✨ Joyful', desc: 'Có ích / Vui' },
                  { value: 'impulsive', label: '🛒 Impulsive', desc: 'Phung phí' }
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setSelectedMood(m.value as any)}
                    className={`py-1.5 px-1 text-[10px] rounded-lg border font-sans text-center transition-all flex flex-col justify-center items-center gap-0.5 cursor-pointer ${
                      selectedMood === m.value
                        ? 'bg-[#6B8467] border-[#6B8467] text-[#FDFBF7] font-semibold'
                        : 'bg-transparent border border-[#2D3B32]/35 text-[#2D3B32]/60 hover:bg-[#6B8467]/10 hover:text-[#2D3B32]'
                    }`}
                  >
                    <span className="font-semibold block">{m.label}</span>
                    <span className="text-[8px] opacity-75">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Memo input */}
            <div className="space-y-1.5">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Memo Note / Ghi chú
              </label>
              <input
                type="text"
                maxLength={50}
                placeholder="Bookstore, organic coffee, taxi..."
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-[#6B8467]"
                id="note-input"
              />
            </div>

            {/* Heavy high-contrast button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !amount}
                className="w-full bg-[#6B8467] text-[#FDFBF7] font-bold uppercase tracking-widest text-xs py-3.5 rounded-lg border border-[#6B8467] transition-all duration-300 hover:bg-[#4E634A] cursor-pointer flex justify-center items-center gap-2 hover:-translate-y-0.5 shadow-xs"
                id="add-transaction-button"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi Nhận Giao Dịch</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (Ledger lists with search query filter & CSV features) */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs h-auto min-h-[300px] overflow-y-auto pb-6">
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#2D3B32]/10 pb-3">
            <div>
              <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Journal History Logs</h4>
              <p className="text-[10px] text-[#2D3B32]/50 italic leading-none font-serif mt-0.5">Filter and query overall entries</p>
            </div>
            
            {/* CSV export action */}
            <button
              onClick={handleExportCSV}
              className="text-[9px] uppercase font-bold tracking-widest text-[#2D3B32] hover:text-[#FAF7F0] hover:bg-[#2D3B32] bg-transparent border border-[#2D3B32]/30 px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-all duration-200"
              title="Get ledger paper format"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Double Search Filters Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-[#2D3B32]/40">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search description/note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FDFBF7] text-xs border border-[#2D3B32]/20 rounded pl-8 pr-3 py-2 focus:outline-none focus:border-[#6B8467] placeholder-[#2D3B32]/40"
              />
            </div>

            <div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="w-full bg-[#FDFBF7] text-xs border border-[#2D3B32]/20 rounded px-3 py-2 focus:outline-none focus:border-[#6B8467] cursor-pointer"
              >
                <option value="all">👁 All categories</option>
                {(data.categories || []).map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    📂 {cat.name}
                  </option>
                ))}
                <option value="Uncategorized">📂 Uncategorized</option>
              </select>
            </div>
          </div>

          {/* Long table transaction lists */}
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#2D3B32]/45 italic border border-dashed border-[#2D3B32]/10 rounded bg-[#FAF7F0]/30">
              No index matches filter terms. Set parameters to try again.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-[#FDFBF7]/70 border border-[#2D3B32]/8 rounded-lg flex justify-between items-center text-xs last:border-b transition-all duration-200 hover:border-[#6B8467]/30"
                >
                  <div className="space-y-1 min-w-0 max-w-[70%]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#2D3B32] truncate block max-w-[150px]" title={t.note}>
                        {t.note || 'Unsorted transaction'}
                      </span>
                      {t.mood && (
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded leading-none shrink-0 ${
                          t.mood === 'impulsive' ? 'bg-[#FDE8E4] text-[#8E4A3E]' :
                          t.mood === 'joy' ? 'bg-[#FEF5D9] text-[#735D1F]' :
                          'bg-[#EBF1EA] text-[#3D523C]'
                        }`}>
                          {t.mood === 'impulsive' ? '🛒 Impulsive' :
                           t.mood === 'joy' ? '✨ Joyful' :
                           '🏠 Essential'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-[#2D3B32]/45">
                      <span className="uppercase text-[#2D3B32]/50 tracking-wide font-bold">{t.category}</span>
                      <span>•</span>
                      <span>{t.date || 'Today'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-serif font-bold text-sm tracking-tight ${t.type === 'income' ? 'text-[#3D523C]' : 'text-[#2D3B32]'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Do you want to delete "${t.note || 'this transaction'}"?`)) {
                          handleDeleteTransaction(t.id);
                        }
                      }}
                      className="text-[#2D3B32]/30 hover:text-red-700 transition-colors p-1"
                      title="Erase transaction log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
