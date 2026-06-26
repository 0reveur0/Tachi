import React, { useState, useMemo } from 'react';
import { Trash2, TrendingUp, ArrowDownUp } from 'lucide-react';

interface Debt {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  type: 'owe_someone' | 'someone_owes_me';
}

interface DebtSnowballProps {
  formatCurrency: (value: number) => string;
  getHeaders: () => Record<string, string>;
  setStatusMessage: (msg: string) => void;
  setData: React.Dispatch<React.SetStateAction<any>>;
  data: any;
}

export const DebtSnowball: React.FC<DebtSnowballProps> = ({
  formatCurrency,
  getHeaders,
  setStatusMessage,
  setData,
  data,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [type, setType] = useState<'owe_someone' | 'someone_owes_me'>('owe_someone');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debts: Debt[] = data?.debts || [];

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amount);
    const cleanRate = Number(interestRate);
    if (!name.trim() || !amount || isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Please provide valid debt name and amount.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          amount: cleanAmount,
          interestRate: isNaN(cleanRate) ? 0 : cleanRate,
          type,
        }),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not add debt record.');
      }
      setData((prev: any) => ({ ...prev, debts: resData.debts }));
      setName('');
      setAmount('');
      setInterestRate('');
      setType('owe_someone');
      setStatusMessage('Debt entry recorded with clarity.');
    } catch (err: any) {
      setError(err.message || 'System error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Could not remove debt.');
      }
      setData((prev: any) => ({ ...prev, debts: resData.debts }));
      setStatusMessage('Debt record cleared.');
    } catch (err: any) {
      setError(err.message || 'Removal failed.');
    }
  };

  // Snowball: Sort debts you owe by amount ascending (smallest first = psychological wins)
  const myDebts = useMemo(() => {
    return debts
      .filter((d) => d.type === 'owe_someone')
      .sort((a, b) => a.amount - b.amount);
  }, [debts]);

  const owedToMe = useMemo(() => {
    return debts.filter((d) => d.type === 'someone_owes_me');
  }, [debts]);

  const totalOwe = myDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalOwed = owedToMe.reduce((sum, d) => sum + d.amount, 0);
  const netDebt = totalOwe - totalOwed;

  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">
          Debt Tracking & Strategy
        </h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Debt Snowball / Tuyết Lăn Trả Nợ ✦
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-5 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Record New Debt</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5">
              Log a loan or debt to track your obligations
            </p>
          </div>

          <form onSubmit={handleAddDebt} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Debt Name / Tên khoản nợ
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Credit Card A, Bank Loan..."
                className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2.5 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                  Amount (VND)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000000"
                  className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2.5 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467] transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="5.5"
                  className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2.5 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
                Type / Loại nợ
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('owe_someone')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                    type === 'owe_someone'
                      ? 'bg-[#8E4A3E] text-[#FDFBF7] border-[#8E4A3E]'
                      : 'bg-transparent text-[#2D3B32]/60 border-[#2D3B32]/20 hover:bg-[#8E4A3E]/10'
                  }`}
                >
                  I Owe Someone
                </button>
                <button
                  type="button"
                  onClick={() => setType('someone_owes_me')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                    type === 'someone_owes_me'
                      ? 'bg-[#6B8467] text-[#FDFBF7] border-[#6B8467]'
                      : 'bg-transparent text-[#2D3B32]/60 border-[#2D3B32]/20 hover:bg-[#6B8467]/10'
                  }`}
                >
                  Someone Owes Me
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#6B8467] text-[#FDFBF7] font-medium text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-300 hover:bg-[#4E634A] disabled:opacity-40 cursor-pointer border border-[#6B8467] shadow-sm hover:shadow-md"
            >
              {submitting ? 'Recording...' : '[ Record Debt ]'}
            </button>

            {error && (
              <div className="p-3 bg-[#FDE8E4] border border-[#8E4A3E]/30 text-[#8E4A3E] text-xs rounded-lg font-mono">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Right: Summary & Snowball Table */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs h-auto min-h-[300px] overflow-y-auto pb-6">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">
              Snowball Strategy & Ledger
            </h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5">
              Ranked by smallest amount first for psychological momentum
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#FDFBF7] border border-[#2D3B32]/10 rounded-lg text-center">
              <span className="text-[8px] uppercase font-mono tracking-widest text-[#8E4A3E]/70">I Owe</span>
              <p className="font-serif text-sm font-bold text-[#8E4A3E] mt-0.5">{formatCurrency(totalOwe)}</p>
            </div>
            <div className="p-3 bg-[#FDFBF7] border border-[#2D3B32]/10 rounded-lg text-center">
              <span className="text-[8px] uppercase font-mono tracking-widest text-[#6B8467]/70">Owed to Me</span>
              <p className="font-serif text-sm font-bold text-[#6B8467] mt-0.5">{formatCurrency(totalOwed)}</p>
            </div>
            <div className="p-3 bg-[#FDFBF7] border border-[#2D3B32]/10 rounded-lg text-center">
              <span className="text-[8px] uppercase font-mono tracking-widest text-[#2D3B32]/50">Net Position</span>
              <p className={`font-serif text-sm font-bold mt-0.5 ${netDebt > 0 ? 'text-[#8E4A3E]' : 'text-[#6B8467]'}`}>
                {formatCurrency(netDebt)}
              </p>
            </div>
          </div>

          {/* Snowball Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDownUp className="w-3 h-3 text-[#2D3B32]/50" />
              <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#2D3B32]">
                Snowball Priority Queue (Smallest First)
              </h5>
            </div>

            {myDebts.length === 0 && owedToMe.length === 0 ? (
              <div className="text-center py-8 text-[#2D3B32]/30 text-xs font-mono">
                No debt records yet. Start by adding your first entry.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#2D3B32]/15 text-[9px] uppercase tracking-widest text-[#2D3B32]/60 font-mono">
                      <th className="py-2">Priority</th>
                      <th className="py-2">Name</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2 text-right">Interest</th>
                      <th className="py-2 text-right">Type</th>
                      <th className="py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3B32]/10">
                    {myDebts.map((debt, idx) => (
                      <tr key={debt.id} className="hover:bg-[#FDFBF7]/40">
                        <td className="py-2.5 font-serif font-bold text-[#8E4A3E]">
                          {idx === 0 ? (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Pay First
                            </span>
                          ) : (
                            `#${idx + 1}`
                          )}
                        </td>
                        <td className="py-2.5 font-semibold text-[#2D3B32]">{debt.name}</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(debt.amount)}</td>
                        <td className="py-2.5 text-right font-mono text-[#2D3B32]/60">{debt.interestRate}%</td>
                        <td className="py-2.5 text-right">
                          <span className="text-[9px] uppercase font-bold bg-[#8E4A3E]/10 text-[#8E4A3E] px-2 py-0.5 rounded">
                            I Owe
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-[#2D3B32]/30 hover:text-[#8E4A3E] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {owedToMe.map((debt) => (
                      <tr key={debt.id} className="hover:bg-[#FDFBF7]/40">
                        <td className="py-2.5 font-mono text-[#2D3B32]/40">—</td>
                        <td className="py-2.5 font-semibold text-[#2D3B32]">{debt.name}</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(debt.amount)}</td>
                        <td className="py-2.5 text-right font-mono text-[#2D3B32]/60">{debt.interestRate}%</td>
                        <td className="py-2.5 text-right">
                          <span className="text-[9px] uppercase font-bold bg-[#6B8467]/10 text-[#6B8467] px-2 py-0.5 rounded">
                            Owed to Me
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteDebt(debt.id)}
                            className="text-[#2D3B32]/30 hover:text-[#8E4A3E] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
