import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Category {
  name: string;
  budget: number;
}

interface JarsProps {
  data: {
    categories: Category[];
    transactions: any[];
    profile: any;
    recurringRules: any[];
  };
  formatCurrency: (value: number) => string;
  spendingSummary: Record<string, number>;
  newCatName: string;
  setNewCatName: (val: string) => void;
  newCatBudget: string;
  setNewCatBudget: (val: string) => void;
  newCatCycle: 'weekly' | 'monthly' | 'yearly';
  setNewCatCycle: (val: 'weekly' | 'monthly' | 'yearly') => void;
  handleCreateCategory: (e: React.FormEvent) => void;
  handleDeleteCategory: (name: string) => void;
  editingCategoryName: string | null;
  setEditingCategoryName: (name: string | null) => void;
  editingBudgetVal: string;
  setEditingBudgetVal: (val: string) => void;
  handleUpdateCategoryBudget: (name: string, newBudget: number) => void;
}

export const Jars: React.FC<JarsProps> = ({
  data,
  formatCurrency,
  spendingSummary,
  newCatName,
  setNewCatName,
  newCatBudget,
  setNewCatBudget,
  newCatCycle,
  setNewCatCycle,
  handleCreateCategory,
  handleDeleteCategory,
  editingCategoryName,
  setEditingCategoryName,
  editingBudgetVal,
  setEditingBudgetVal,
  handleUpdateCategoryBudget,
}) => {
  // Categorization formulas
  const isAccumulation = (name: string) => {
    const key = name.toLowerCase();
    return /saving|invest|accumulat|tích lũy|dự phòng|quỹ/i.test(key);
  };

  const spendingCategories = (data.categories || []).filter(c => !isAccumulation(c.name));
  const accumulationCategories = (data.categories || []).filter(c => isAccumulation(c.name));

  const renderCategoryCard = (cat: Category) => {
    const spent = spendingSummary[cat.name.toLowerCase()] || 0;
    const pct = cat.budget > 0 ? (spent / cat.budget) * 100 : 0;
    const isOver = spent > cat.budget;
    const isEditing = editingCategoryName === cat.name;

    return (
      <div key={cat.name} className="p-4 bg-[#FDFBF7] border border-[#2D3B32]/12 rounded-lg space-y-3.5 shadow-xs relative">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h5 className="font-serif text-sm text-[#2D3B32] font-semibold truncate leading-tight uppercase">
              📂 {cat.name}
            </h5>
            <span className="text-[8px] font-mono text-[#2D3B32]/40 tracking-widest uppercase">
              Jar Partition index
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to discard the "${cat.name}" jar?`)) {
                  handleDeleteCategory(cat.name);
                }
              }}
              className="text-[#2D3B32]/30 hover:text-red-700 transition-colors p-0.5"
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Budget limit visual line status */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-[10px] text-[#2D3B32]/50 font-serif">
              Spent: <strong>{formatCurrency(spent)}</strong>
            </span>
            <span className="text-[9px] font-mono text-[#2D3B32]/45">
              Target: {formatCurrency(cat.budget)}
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-[#E2EAE0] h-1.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-[#E54B4B]' : 'bg-[#6B8467]'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className={`font-bold ${isOver ? 'text-[#8E4A3E]' : 'text-[#2D3B32]/50'}`}>
              {pct.toFixed(0)}% Utilized
            </span>

            {/* Inline Editor triggers */}
            {!isEditing ? (
              <button
                onClick={() => {
                  setEditingCategoryName(cat.name);
                  setEditingBudgetVal(String(cat.budget));
                }}
                className="text-[9px] font-bold uppercase text-[#2D3B32]/60 hover:text-[#6B8467] border-b border-[#2D3B32]/20 leading-none pb-0.5 cursor-pointer"
              >
                [Edit limit]
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editingBudgetVal}
                  onChange={(e) => setEditingBudgetVal(e.target.value)}
                  className="w-16 bg-[#FDFBF7] text-[10px] border border-[#2D3B32]/25 rounded text-center px-1 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const clean = Number(editingBudgetVal);
                    if (!isNaN(clean) && clean >= 0) {
                      handleUpdateCategoryBudget(cat.name, clean);
                    }
                    setEditingCategoryName(null);
                  }}
                  className="bg-[#6B8467] text-[#FDFBF7] text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                >
                  OK
                </button>
                <button
                  onClick={() => setEditingCategoryName(null)}
                  className="bg-gray-200 text-gray-700 text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                >
                  X
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dry jar status details */}
        {isOver && (
          <p className="text-[9px] text-[#8E4A3E] bg-[#FDE8E4] p-2 rounded border border-[#8E4A3E]/10 italic font-serif leading-tight">
            ❧ This organic jar has dried. Best to logs and reduce outflows thoughtfully.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      {/* Page Title */}
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50 font-sans">Budget Allocations</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Jars Designer & Boundaries / Các Hũ Ngân Sách ✦
        </h3>
      </div>

      {/* Two columns layout partition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Column 1: Spending boundaries */}
        <div className="space-y-4">
          <div className="border-b border-[#2D3B32]/10 pb-1.5 flex justify-between items-baseline">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">
              [ Spending Boundaries ]
            </h4>
            <span className="text-[9px] font-mono text-[#2D3B32]/45">[{spendingCategories.length} jars limits]</span>
          </div>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {spendingCategories.map(renderCategoryCard)}
          </div>
        </div>

        {/* Column 2: Accumulation targets */}
        <div className="space-y-4">
          <div className="border-b border-[#2D3B32]/10 pb-1.5 flex justify-between items-baseline">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">
              [ Accumulation Targets ]
            </h4>
            <span className="text-[9px] font-mono text-[#2D3B32]/45">[{accumulationCategories.length} growth funds]</span>
          </div>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {accumulationCategories.length === 0 ? (
              <div className="py-12 bg-transparent text-center text-xs italic text-[#2D3B32]/40 p-4 border border-dashed border-[#2D3B32]/15 rounded-lg leading-relaxed font-serif">
                Currently, no savings/investments jars exist.<br/>
                Create a category with keyword like "Savings" or "Quỹ" to store accumulation funds securely.
              </div>
            ) : (
              accumulationCategories.map(renderCategoryCard)
            )}
          </div>
        </div>
      </div>

      {/* Underline Styled creation layout form */}
      <div className="p-6 bg-[#FAF7F0] border border-[#2D3B32]/12 rounded-xl space-y-4 shadow-xs max-w-xl mx-auto">
        <div className="border-b border-[#2D3B32]/10 pb-2">
          <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Design New Cash Jar</h4>
          <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5">Partition cash limits on chosen periodic cycles</p>
        </div>

        <form onSubmit={handleCreateCategory} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Underline input 1 */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Jar Label Name / Tên Hũ
              </label>
              <input
                type="text"
                required
                placeholder="E.g. Coffee, travel fund..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-transparent border-b border-[#2D3B32]/30 py-2 focus:border-[#6B8467] text-xs text-[#2D3B32] font-semibold focus:outline-none transition-colors"
              />
            </div>

            {/* Underline input 2 */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Target Budget VND / Doanh Mức
              </label>
              <input
                type="number"
                required
                min="1000"
                placeholder="VND target limit size"
                value={newCatBudget}
                onChange={(e) => setNewCatBudget(e.target.value)}
                className="w-full bg-transparent border-b border-[#2D3B32]/30 py-2 focus:border-[#6B8467] text-xs text-[#2D3B32] font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            {/* Recurrence selection underline selector */}
            <div className="space-y-1.5">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Cycle Period / Định kỳ Hũ
              </label>
              <select
                value={newCatCycle}
                onChange={(e) => setNewCatCycle(e.target.value as any)}
                className="w-full bg-transparent border-b border-[#2D3B32]/30 py-2 focus:border-[#6B8467] text-xs text-[#2D3B32] focus:outline-none cursor-pointer"
              >
                <option value="weekly">🗓 Weekly / Hàng tuần</option>
                <option value="monthly">🗓 Monthly / Hàng tháng (Default)</option>
                <option value="yearly">🗓 Yearly / Hàng năm</option>
              </select>
            </div>

            {/* Accent colored solid action button */}
            <div>
              <button
                type="submit"
                className="w-full bg-[#6B8467] hover:bg-[#4E634A] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest py-3 rounded transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Ươm Mầm Hũ Mới</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
