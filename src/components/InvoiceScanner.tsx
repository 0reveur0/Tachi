import React, { useState } from 'react';
import { ScanLine, FileImage } from 'lucide-react';

interface InvoiceScannerProps {
  formatCurrency: (value: number) => string;
  getHeaders: () => Record<string, string>;
  setStatusMessage: (msg: string) => void;
  setData: React.Dispatch<React.SetStateAction<any>>;
}

interface ScannedInvoice {
  amount: number;
  name: string;
  category: string;
  mood: 'impulsive' | 'essential' | 'joy';
}

export const InvoiceScanner: React.FC<InvoiceScannerProps> = ({
  formatCurrency,
  getHeaders,
  setStatusMessage,
  setData,
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedInvoice | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [previewAmount, setPreviewAmount] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [previewCategory, setPreviewCategory] = useState('');
  const [previewMood, setPreviewMood] = useState<'impulsive' | 'essential' | 'joy'>('essential');

  const handleScan = async () => {
    if (!imageUrl.trim()) {
      setScanError('Please provide an image URL to scan.');
      return;
    }
    setScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const response = await fetch('/api/transactions/scan-invoice', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Invoice scanning failed.');
      }
      setScanResult(resData);
      setPreviewAmount(String(resData.amount || ''));
      setPreviewName(resData.name || '');
      setPreviewCategory(resData.category || 'Essential');
      setPreviewMood(resData.mood || 'essential');
    } catch (err: any) {
      setScanError(err.message || 'System error during scan.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveTransaction = async () => {
    const cleanAmount = Number(previewAmount);
    if (!previewAmount || isNaN(cleanAmount) || cleanAmount <= 0) {
      setScanError('Amount is required to save.');
      return;
    }
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: cleanAmount,
          category: previewCategory,
          note: previewName,
          mood: previewMood,
          type: 'expense',
        }),
      });
      if (!response.ok) throw new Error('Could not save invoice entry.');
      const updatedTransactions = await response.json();
      setData((prev: any) => ({ ...prev, transactions: updatedTransactions }));
      setScanResult(null);
      setImageUrl('');
      setPreviewAmount('');
      setPreviewName('');
      setPreviewCategory('');
      setScanError(null);
      setStatusMessage('Invoice entry recorded with precision.');
    } catch (err: any) {
      setScanError(err.message || 'Save failed.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">AI Vision Engine</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Invoice AI Scanner / Máy Quét Hóa Đơn ✦
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Dropzone / URL input */}
        <div className="lg:col-span-5 bg-[#E2EAE0]/40 border border-dashed border-[#2D3B32]/30 p-6 rounded-xl space-y-6">
          <div className="flex items-center gap-2 text-[#2D3B32]/70">
            <FileImage className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Upload Document</span>
          </div>

          <div className="space-y-2">
            <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">
              Image URL / Đường dẫn ảnh hóa đơn
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL here..."
              className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2.5 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467] transition-colors"
            />
            <p className="text-[9px] text-[#2D3B32]/40 italic">
              Provide a direct URL to an invoice image (receipt, bill, etc.) for Gemini to analyze.
            </p>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning || !imageUrl.trim()}
            className="w-full bg-[#6B8467] text-[#FDFBF7] font-medium text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-300 hover:bg-[#4E634A] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-[#6B8467] shadow-sm hover:shadow-md"
          >
            {scanning ? 'Scanning with Gemini...' : '[ Scan Document with Gemini ]'}
          </button>

          {scanError && (
            <div className="p-3 bg-[#FDE8E4] border border-[#8E4A3E]/30 text-[#8E4A3E] text-xs rounded-lg font-mono">
              {scanError}
            </div>
          )}
        </div>

        {/* Right: Preview & Save */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-6 shadow-xs h-auto min-h-[300px] overflow-y-auto pb-6">
          <div className="border-b border-[#2D3B32]/10 pb-2">
            <h4 className="text-xs uppercase font-bold tracking-widest text-[#2D3B32]">Scan Result Preview</h4>
            <p className="text-[10px] text-[#2D3B32]/50 italic mt-0.5">Review extracted data before saving to your ledger</p>
          </div>

          {!scanResult && !scanning && (
            <div className="flex flex-col items-center justify-center py-12 text-[#2D3B32]/30 gap-3">
              <ScanLine className="w-10 h-10" />
              <p className="text-xs font-mono uppercase tracking-widest">No scan performed yet</p>
              <p className="text-[9px] italic font-serif">Enter an image URL and press scan to begin.</p>
            </div>
          )}

          {scanning && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-[#6B8467] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-widest text-[#6B8467]">Gemini is analyzing...</p>
            </div>
          )}

          {scanResult && !scanning && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">Amount (VND)</label>
                  <input
                    type="number"
                    value={previewAmount}
                    onChange={(e) => setPreviewAmount(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">Item Name</label>
                  <input
                    type="text"
                    value={previewName}
                    onChange={(e) => setPreviewName(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">Category</label>
                  <input
                    type="text"
                    value={previewCategory}
                    onChange={(e) => setPreviewCategory(e.target.value)}
                    className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-bold text-[#2D3B32]/65 tracking-widest">Mood</label>
                  <select
                    value={previewMood}
                    onChange={(e) => setPreviewMood(e.target.value as any)}
                    className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded-lg px-3 py-2 text-xs text-[#2D3B32] font-mono focus:outline-none focus:border-[#6B8467]"
                  >
                    <option value="essential">Essential</option>
                    <option value="joy">Joy</option>
                    <option value="impulsive">Impulsive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveTransaction}
                  className="bg-[#6B8467] text-[#FDFBF7] font-medium text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-lg transition-all duration-300 hover:bg-[#4E634A] cursor-pointer border border-[#6B8467] shadow-sm hover:shadow-md"
                >
                  [ Save to Ledger ]
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
