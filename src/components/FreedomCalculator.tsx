import React, { useMemo } from 'react';

interface FreedomCalculatorProps {
  formatCurrency: (value: number) => string;
  calcMonthlyExpense: string;
  setCalcMonthlyExpense: (val: string) => void;
  calcInflation: string;
  setCalcInflation: (val: string) => void;
  calcYears: string;
  setCalcYears: (val: string) => void;
}

export const FreedomCalculator: React.FC<FreedomCalculatorProps> = ({
  formatCurrency,
  calcMonthlyExpense,
  setCalcMonthlyExpense,
  calcInflation,
  setCalcInflation,
  calcYears,
  setCalcYears,
}) => {
  // Convert inputs
  const expense = Number(calcMonthlyExpense) || 15000000;
  const inflationRate = Number(calcInflation) || 4; // 4% default
  const yearsVal = Number(calcYears) || 20;

  // Calculators
  const calcResults = useMemo(() => {
    const rateDecimal = inflationRate / 100;
    
    // Future Value factor = (1 + r)^n
    const fvFactor = Math.pow(1 + rateDecimal, yearsVal);
    const fvMonthlyExpense = expense * fvFactor;
    
    // Nest Egg Goal = Monthly * 12 * 25 (Standard 4% withdrawal size index)
    const nestEggTarget = fvMonthlyExpense * 12 * 25;

    // Linear monthly savings required: nestegg / (years * 12)
    const linearMonthlySavings = nestEggTarget / (yearsVal * 12);

    // Milestones details helper
    const milestones = [5, 10, 15, yearsVal].map((yrs) => {
      const multiplier = Math.pow(1 + rateDecimal, yrs);
      const fvEx = expense * multiplier;
      const nest = fvEx * 12 * 25;
      return {
        years: yrs,
        fvExpense: fvEx,
        nestEgg: nest,
        pctIncrease: (multiplier - 1) * 100
      };
    });

    return {
      fvMonthlyExpense,
      nestEggTarget,
      linearMonthlySavings,
      milestones
    };
  }, [expense, inflationRate, yearsVal]);

  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      {/* View Intro */}
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">Financial Projection Model</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ The Time-Travel Freedom Calculator / Bàn Tính Tự Do ✦
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Subparts: Parameters Form with underline styling */}
        <div className="lg:col-span-5 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Configure Parameters</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5">Define your current standard cost parameters and timeline of choice</p>
          </div>

          <div className="space-y-5">
            {/* Input 1 info */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Current Monthly Living Cost / Chi phí hàng tháng (VND)
              </label>
              <input
                type="number"
                value={calcMonthlyExpense}
                onChange={(e) => setCalcMonthlyExpense(e.target.value)}
                placeholder="15000000"
                className="w-full bg-transparent border-b border-[#2D3B32]/30 py-2 focus:border-[#6B8467] text-xs text-[#2D3B32] font-mono focus:outline-none transition-colors"
              />
              <p className="text-[9px] text-[#2D3B32]/40 italic">Average expenses to maintain your target lifestyle index today.</p>
            </div>

            {/* Input 2 info */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Expected Inflation Rate / Lạm phát kỳ vọng (% / Year)
              </label>
              <input
                type="number"
                step="0.1"
                value={calcInflation}
                onChange={(e) => setCalcInflation(e.target.value)}
                placeholder="4"
                className="w-full bg-transparent border-b border-[#2D3B32]/30 py-2 focus:border-[#6B8467] text-xs text-[#2D3B32] font-mono focus:outline-none transition-colors"
              />
              <p className="text-[9px] text-[#2D3B32]/40 italic">Historically around 3.5% - 5% annually for emerging currencies.</p>
            </div>

            {/* Input 3 info */}
            <div className="space-y-1">
              <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Active Accumulation Years / Số năm tích lũy
              </label>
              <input
                type="number"
                value={calcYears}
                onChange={(e) => setCalcYears(e.target.value)}
                placeholder="20"
                className="w-full bg-transparent border-b border-[#2D3B32]/30 py-2 focus:border-[#6B8467] text-xs text-[#2D3B32] font-mono focus:outline-none transition-colors"
              />
              <p className="text-[9px] text-[#2D3B32]/40 italic">Your active time horizon until you cease manual labor.</p>
            </div>
          </div>
        </div>

        {/* Right Subparts: Calculation results panels and comparative table */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs h-auto min-h-[300px] overflow-y-auto pb-6">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Time-Travel Projections • Kết Quả Phân Tích</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic leading-none font-serif mt-0.5">Compounds target costs and safe withdrawal boundaries over time</p>
          </div>

          {/* Results Bento Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 bg-[#FDFBF7] border border-[#2D3B32]/10 rounded-lg space-y-1">
              <span className="text-[8px] tracking-widest font-mono uppercase text-[#2D3B32]/45">Future Adjusted Expense</span>
              <p className="text-[9px] text-[#2D3B32]/65 italic leading-none">Chi phí tương lai (Hàng tháng)</p>
              <h5 className="font-serif text-base font-bold text-[#2D3B32] pt-1">
                {formatCurrency(calcResults.fvMonthlyExpense)}
              </h5>
            </div>

            <div className="p-4 bg-[#FDFBF7] border border-[#2D3B32]/10 rounded-lg space-y-1">
              <span className="text-[8px] tracking-widest font-mono uppercase text-[#2D3B32]/45">Target Nest Egg Goal</span>
              <p className="text-[9px] text-[#2D3B32]/65 italic leading-none">Quỹ Tự Do An Toàn (4% Rule)</p>
              <h5 className="font-serif text-base font-bold text-[#3D523C] pt-1">
                {formatCurrency(calcResults.nestEggTarget)}
              </h5>
            </div>

            <div className="p-4 bg-[#FDFBF7] border border-[#2D3B32]/10 rounded-lg space-y-1 sm:col-span-2">
              <span className="text-[8px] tracking-widest font-mono uppercase text-[#2D3B32]/45">Linear Contribution needed</span>
              <p className="text-[9px] text-[#2D3B32]/65 italic leading-none">Cần tích lũy hàng tháng (Không lãi kép)</p>
              <h5 className="font-serif text-base font-bold text-[#735D1F] pt-0.5">
                {formatCurrency(calcResults.linearMonthlySavings)} / Month
              </h5>
              <span className="text-[8px] text-[#2D3B32]/40 block italic mt-1 leading-tight text-justify">
                ❧ Note: Calculated without investment compounding to represent a safe baseline. If invested with 7% yields, required contributions decrease significantly.
              </span>
            </div>

          </div>

          {/* Milestone Projections Compare list */}
          <div className="space-y-3">
            <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#2D3B32]">
              Decade Milestones • Mốc Thời Gian Thực Tế
            </h5>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2D3B32]/15 text-[9px] uppercase tracking-widest text-[#2D3B32]/60 font-mono">
                    <th className="py-2">Horizon</th>
                    <th className="py-2 text-right">Future cost/m</th>
                    <th className="py-2 text-right">Total Nest Egg</th>
                    <th className="py-2 text-right">Compounded price rise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3B32]/10">
                  {calcResults.milestones.map((m) => (
                    <tr key={m.years} className={`hover:bg-[#FDFBF7]/40 ${m.years === yearsVal ? 'bg-[#6B8467]/10 font-bold' : ''}`}>
                      <td className="py-2.5 font-semibold text-[#2D3B32]">
                        {m.years} Decades ({new Date().getFullYear() + m.years})
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        {formatCurrency(m.fvExpense)}
                      </td>
                      <td className="py-2.5 text-right font-serif text-[#3D523C]">
                        {formatCurrency(m.nestEgg)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[10px] text-[#8E4A3E]">
                        +{m.pctIncrease.toFixed(0)}% CPI markup
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
