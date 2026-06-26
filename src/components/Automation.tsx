import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Category {
  name: string;
  budget: number;
}

interface RecurringRule {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  name: string;
  dayOfMonth: number;
  category?: string;
}

interface AutomationProps {
  data: {
    categories: Category[];
    transactions: any[];
    profile: any;
    recurringRules: RecurringRule[];
  };
  formatCurrency: (value: number) => string;
  recType: 'expense' | 'income';
  setRecType: (value: 'expense' | 'income') => void;
  recAmount: string;
  setRecAmount: (value: string) => void;
  recName: string;
  setRecName: (value: string) => void;
  recDay: number;
  setRecDay: (value: number) => void;
  recCategory: string;
  setRecCategory: (value: string) => void;
  handleAddRecurringRule: (e: React.FormEvent) => void;
  handleDeleteRecurringRule: (id: string) => void;
  disabledRuleIds: string[];
  handleToggleRule: (id: string) => void;
  submitting: boolean;
}

export const Automation: React.FC<AutomationProps> = ({
  data,
  formatCurrency,
  recType,
  setRecType,
  recAmount,
  setRecAmount,
  recName,
  setRecName,
  recDay,
  setRecDay,
  recCategory,
  setRecCategory,
  handleAddRecurringRule,
  handleDeleteRecurringRule,
  disabledRuleIds,
  handleToggleRule,
  submitting,
}) => {
  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      {/* Title block */}
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">Scheduler Garden</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Recurring Automation Garden / Lệnh Định Kỳ Tự Động ✦
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Register Schedule form */}
        <div className="lg:col-span-5 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Plant Automation</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5 font-serif">Setup recurring cash actions to trigger automatically each month</p>
          </div>

          <form onSubmit={handleAddRecurringRule} className="space-y-4">
            
            {/* Action flow direction selectors */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-widest">
                Action Sector / Hướng Dòng Tiền
              </label>
              <div className="flex bg-[#E2EAE0]/50 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRecType('expense')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    recType === 'expense'
                      ? 'bg-[#E54B4B] text-[#FDFBF7] shadow-sm'
                      : 'text-[#2D3B32]/65 hover:text-[#2D3B32]'
                  }`}
                >
                  Chi Phí Định Kỳ (-)
                </button>
                <button
                  type="button"
                  onClick={() => setRecType('income')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    recType === 'income'
                      ? 'bg-[#6B8467] text-[#FDFBF7] shadow-sm'
                      : 'text-[#2D3B32]/65 hover:text-[#2D3B32]'
                  }`}
                >
                  Thu Nhập Tự Động (+)
                </button>
              </div>
            </div>

            {/* Description note label */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-widest">
                Rule Label Name / Tên Tác Vụ
              </label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="E.g. Paycheck, apartment rent, Spotify..."
                value={recName}
                onChange={(e) => setRecName(e.target.value)}
                className="w-full bg-[#FDFBF7] text-xs border border-[#2D3B32]/20 rounded p-2 focus:outline-none focus:border-[#6B8467]"
              />
            </div>

            {/* Amount target limit check */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-widest">
                Amount size VND / Giao Trị
              </label>
              <div className="flex items-baseline border-b border-[#2D3B32]/20 focus-within:border-[#6B8467] py-2 transition-all">
                <span className="font-serif text-sm text-[#2D3B32]/50 select-none mr-2">VND</span>
                <input
                  type="number"
                  required
                  min="1000"
                  placeholder="0"
                  value={recAmount}
                  onChange={(e) => setRecAmount(e.target.value)}
                  className="w-full bg-transparent border-none text-base text-[#2D3B32] font-semibold font-mono focus:outline-none placeholder-[#2D3B32]/15"
                />
              </div>
            </div>

            {/* Recurring Day selector calendar */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-widest">
                Trigger Day of Month / Ngày chuyển giao (1 - 31)
              </label>
              <input
                type="number"
                required
                min="1"
                max="31"
                placeholder="15"
                value={recDay}
                onChange={(e) => setRecDay(Number(e.target.value))}
                className="w-full bg-[#FDFBF7] text-xs border border-[#2D3B32]/20 rounded p-2 focus:outline-none focus:border-[#6B8467] font-mono"
              />
            </div>

            {/* Budget category assignation */}
            {recType === 'expense' && (
              <div className="space-y-1">
                <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                  Assign to Jar / Hũ Chi Phí
                </label>
                <select
                  value={recCategory}
                  onChange={(e) => setRecCategory(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded text-xs py-2 px-3 focus:outline-none focus:border-[#6B8467] cursor-pointer"
                >
                  {(data.categories || []).map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      📂 {cat.name}
                    </option>
                  ))}
                  <option value="Uncategorized">📂 Uncategorized</option>
                </select>
              </div>
            )}

            {/* Form actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !recAmount || !recName}
                className="w-full bg-[#6B8467] hover:bg-[#4E634A] text-[#FDFBF7] font-bold uppercase tracking-widest text-xs py-3.5 rounded-lg border border-[#6B8467] transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 hover:-translate-y-0.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Hoạt hóa lệnh định kỳ</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active scheduler manager indices */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs h-auto min-h-[300px] overflow-y-auto pb-6">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Active Scheduler Rules</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic leading-none font-serif mt-0.5">Automated events checked once daily</p>
          </div>

          {(data.recurringRules || []).length === 0 ? (
            <div className="py-12 bg-[#FAF7F0]/30 text-center text-xs italic text-[#2D3B32]/45 border border-dashed border-[#2D3B32]/10 rounded-lg">
              No automation rules planted. Add your paycheck or electric bill to start!
            </div>
          ) : (
            <div className="space-y-4">
              {(data.recurringRules || []).map((rule) => {
                const isMuted = disabledRuleIds.includes(rule.id);
                return (
                  <div
                    key={rule.id}
                    className={`p-4 bg-[#FDFBF7]/85 border rounded-lg transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden ${
                      isMuted 
                        ? 'border-[#2D3B32]/10 opacity-60 bg-[#FAF7F0]' 
                        : 'border-[#2D3B32]/20 shadow-xs hover:border-[#6B8467]'
                    }`}
                  >
                    {/* Visual left ribbon indicator */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      isMuted ? 'bg-gray-400' : rule.type === 'income' ? 'bg-[#6B8467]' : 'bg-[#E54B4B]'
                    }`} />

                    <div className="pl-2 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className={`font-serif text-sm font-semibold truncate ${isMuted ? 'line-through text-gray-500' : 'text-[#2D3B32]'}`}>
                          {rule.name}
                        </h5>
                        <span className={`text-[8px] font-mono leading-none px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isMuted 
                            ? 'bg-gray-200 text-gray-600'
                            : rule.type === 'income' 
                              ? 'bg-[#EBF1EA] text-[#3D523C]' 
                              : 'bg-[#FDE8E4] text-[#8E4A3E]'
                        }`}>
                          {isMuted ? 'Muted / Tắt' : rule.type === 'income' ? '🟢 Income' : '🔴 Expense'}
                        </span>
                      </div>

                      <p className="text-[10px] text-[#2D3B32]/50 italic font-serif">
                        Runs every Month on <strong>Day {rule.dayOfMonth}</strong>
                      </p>
                      
                      {rule.type === 'expense' && rule.category && (
                        <span className="text-[9px] font-mono text-[#2D3B32]/40 uppercase tracking-wider block bg-[#2D3B32]/5 px-2 py-0.5 rounded w-max">
                          Folder: {rule.category}
                        </span>
                      )}
                    </div>

                    {/* Actions Panel: Toggle and Erase rule */}
                    <div className="flex items-center gap-3 self-end sm:self-auto leading-none">
                      {/* ON/OFF toggle tactile switch */}
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded transition-all cursor-pointer border ${
                          isMuted
                            ? 'bg-transparent border-[#2D3B32]/20 text-[#2D3B32]/45 hover:bg-[#2D3B32]/10 hover:text-[#2D3B32]'
                            : 'bg-[#6B8467] border-[#6B8467] text-[#FDFBF7] hover:bg-[#4E634A]'
                        }`}
                        title={isMuted ? "Activate automated tasks" : "Mute automated tasks"}
                      >
                        {isMuted ? '⚙ OFF' : '⚡ ON'}
                      </button>

                      {/* Deletion button */}
                      <button
                        onClick={() => {
                          if (confirm(`Do you wish to delete the automated rule for "${rule.name}"?`)) {
                            handleDeleteRecurringRule(rule.id);
                          }
                        }}
                        className="text-[#2D3B32]/30 hover:text-red-700 transition-colors p-1"
                        title="Discard automated task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
