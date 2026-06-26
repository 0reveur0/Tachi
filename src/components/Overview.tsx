import React from 'react';
import { Plus } from 'lucide-react';

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
  categories: any[];
  transactions: Transaction[];
  profile: any;
  recurringRules: any[];
}

interface OverviewProps {
  data: FinancialData;
  formatCurrency: (value: number) => string;
  setActiveView: (view: any) => void;
  intelligenceMetrics: {
    totalSpentWithMoods: number;
    moodBreakdown: Record<string, number>;
    totalBudget: number;
    balanceRemaining: number;
    monthlyIncome: number;
    monthlyExpense: number;
    netMonthly: number;
    projectedSixMonths: number;
    projectedEndYear: number;
  };
}

export const Overview: React.FC<OverviewProps> = ({
  data,
  formatCurrency,
  setActiveView,
  intelligenceMetrics,
}) => {
  // Compute overall cumulative assets: manual and auto transaction sums
  const totalIncome = (data.transactions || [])
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = (data.transactions || [])
    .filter(t => t.type !== 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalAssets = totalIncome - totalExpense;

  // Recent 5 entries
  const recentEntries = [...(data.transactions || [])]
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-fade-in text-[#2D3B32]">
      {/* View Intro branding */}
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">
          Bookkeeper Overview
        </h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Overview & Balance / Khái Lược Thu Chi ✦
        </h3>
      </div>

      {/* Main Metric Cards Grid - Structured Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Accumulated Assets */}
        <div className="bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] tracking-widest font-mono uppercase text-[#2D3B32]/45">Net Cumulative Capital</span>
            <h4 className="text-[9px] text-[#2D3B32]/60 font-medium italic mt-0.5">Tổng Tài Sản Tự Có</h4>
          </div>
          <div className="mt-6">
            <span className={`font-serif text-2xl font-bold tracking-tight ${totalAssets >= 0 ? 'text-[#3D523C]' : 'text-[#8E4A3E]'}`}>
              {totalAssets >= 0 ? '+' : ''}{formatCurrency(totalAssets)}
            </span>
            <p className="text-[8px] font-mono text-[#2D3B32]/40 uppercase tracking-wider mt-1.5">
              Accumulated cash flow diff
            </p>
          </div>
        </div>

        {/* Metric 2: Allocated Budget Jars */}
        <div className="bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] tracking-widest font-mono uppercase text-[#2D3B32]/45">Allocated Budget Pool</span>
            <h4 className="text-[9px] text-[#2D3B32]/60 font-medium italic mt-0.5 font-serif">Mức Phân Bổ Hũ Giới Hạn</h4>
          </div>
          <div className="mt-6">
            <span className="font-serif text-2xl text-[#2D3B32] font-bold tracking-tight">
              {formatCurrency(intelligenceMetrics.totalBudget)}
            </span>
            <p className="text-[8px] font-mono text-[#2D3B32]/40 uppercase tracking-wider mt-1.5">
              Cumulative upper boundary limits
            </p>
          </div>
        </div>

        {/* Metric 3: Remaining Reserves */}
        <div className="bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[10px] tracking-widest font-mono uppercase text-[#2D3B32]/45">Free Jar Reserves</span>
            <h4 className="text-[9px] text-[#2D3B32]/60 font-medium italic mt-0.5">Số Dư Hũ Khả Dụng</h4>
          </div>
          <div className="mt-6">
            <span className="font-serif text-2xl text-[#3D523C] font-bold tracking-tight">
              {formatCurrency(intelligenceMetrics.balanceRemaining)}
            </span>
            <p className="text-[8px] font-mono text-[#2D3B32]/40 uppercase tracking-wider mt-1.5 text-[#3D523C]/70">
              Within safe spending caps
            </p>
          </div>
        </div>
      </div>

      {/* Projection Block */}
      <div className="p-6 bg-[#E2EAE0]/40 border border-[#2D3B32]/10 rounded-xl space-y-4">
        <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32] border-b border-[#2D3B32]/10 pb-2">
          Estimated Recurrence Projections • Ước Tính Chu Kỳ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-serif italic">
          <div className="space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-wider text-[#2D3B32]/50 not-italic">Monthly Cash Flow net</p>
            <p className="font-bold text-sm text-[#2D3B32]">{intelligenceMetrics.netMonthly >= 0 ? '+' : ''}{formatCurrency(intelligenceMetrics.netMonthly)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-wider text-[#2D3B32]/50 not-italic">6-Month Future Projection</p>
            <p className="font-bold text-sm text-[#2D3B32]">{intelligenceMetrics.projectedSixMonths >= 0 ? '+' : ''}{formatCurrency(intelligenceMetrics.projectedSixMonths)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-wider text-[#2D3B32]/50 not-italic">12-Month Expected Sum</p>
            <p className="font-bold text-sm text-[#2D3B32]">{intelligenceMetrics.projectedEndYear >= 0 ? '+' : ''}{formatCurrency(intelligenceMetrics.projectedEndYear)}</p>
          </div>
        </div>
      </div>

      {/* Recent Ledger Modifications Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline border-b border-dashed border-[#2D3B32]/20 pb-2">
          <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">
            Biến Động Gần Đây / Recent Activities
          </h4>
          <span className="text-[9px] font-mono text-[#2D3B32]/40">[{recentEntries.length} items logged]</span>
        </div>

        {recentEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#2D3B32]/45 italic border border-dashed border-[#2D3B32]/15 rounded-xl bg-[#FAF7F0]/40">
            No entries captured in this journal yet. Click Record below to add some!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2D3B32]/15 text-[10px] uppercase tracking-widest text-[#2D3B32]/60 font-mono">
                  <th className="py-2.5 font-bold">Memo / Description</th>
                  <th className="py-2.5 font-bold">Category</th>
                  <th className="py-2.5 font-bold text-right">Amount</th>
                  <th className="py-2.5 font-bold text-center">Mood Tag</th>
                  <th className="py-2.5 font-bold text-right">Logged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3B32]/10">
                {recentEntries.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF7F0]/50 transition-colors">
                    <td className="py-3 font-medium text-[#2D3B32] truncate max-w-[200px]">
                      {t.note || 'Unsorted Entry'}
                    </td>
                    <td className="py-3 text-[10px] font-mono text-[#2D3B32]/60">
                      {t.category}
                    </td>
                    <td className={`py-3 text-right font-serif font-bold ${t.type === 'income' ? 'text-[#3D523C]' : 'text-[#2D3B32]'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 text-center">
                      {t.mood ? (
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide inline-block leading-none ${
                          t.mood === 'impulsive' ? 'bg-[#FDE8E4] text-[#8E4A3E]' :
                          t.mood === 'joy' ? 'bg-[#FEF5D9] text-[#735D1F]' :
                          'bg-[#EBF1EA] text-[#3D523C]'
                        }`}>
                          {t.mood === 'impulsive' ? '🛒 Impulsive' :
                           t.mood === 'joy' ? '✨ Joyful' :
                           '🏠 Essential'}
                        </span>
                      ) : (
                        <span className="text-[#2D3B32]/30 italic text-[9px]">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono text-[10px] text-[#2D3B32]/45">
                      {t.date || 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 text-right">
          <button
            onClick={() => setActiveView('ledger')}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#FDFBF7] bg-[#6B8467] hover:bg-[#4E634A] py-2.5 px-4 rounded transition-all duration-300 cursor-pointer shadow-xs hover:-translate-y-0.5"
            id="open-ledger-quick-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            ✦ Ghi Giao Dịch Mới / Record Entry
          </button>
        </div>
      </div>
    </div>
  );
};
