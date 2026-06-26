import React from 'react';
import { Sparkles } from 'lucide-react';

interface IntelligenceData {
  summary: string;
  archetype: string;
  letter: string;
  meters: {
    savings: number;
    impulsive: number;
    balanced: number;
  };
}

interface IntelligenceProps {
  intelligenceLoading: boolean;
  intelligenceData: IntelligenceData | null;
  fetchIntelligence: () => void;
}

export const Intelligence: React.FC<IntelligenceProps> = ({
  intelligenceLoading,
  intelligenceData,
  fetchIntelligence,
}) => {
  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      {/* View Intro */}
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">Gemini Intelligence AI</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Gemini Intelligence / Sự Khôn Ngoan Nhân Tạo ✦
        </h3>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Summon Heavy Action Button */}
        <div className="text-center">
          <button
            onClick={fetchIntelligence}
            disabled={intelligenceLoading}
            className="inline-flex items-center gap-2.5 bg-[#6B8467] hover:bg-[#4E634A] text-[#FDFBF7] font-bold uppercase tracking-widest text-xs py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer hover:-translate-y-0.5"
            id="summon-ai-analysis-button"
          >
            <Sparkles className="w-4 h-4 text-[#FEF5D9] animate-pulse" />
            <span>✨ Triệu Hồi Trợ Lý AI Phân Tích / Summon AI Wisdom</span>
          </button>
          
          <p className="text-[10px] text-[#2D3B32]/45 italic font-serif mt-2">
            Invokes Gemini models to read entire manual journals and diagnostic archetypes
          </p>
        </div>

        {/* Dynamic Loading block */}
        {intelligenceLoading && (
          <div className="py-16 text-center space-y-3.5">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-[#6B8467] animate-spin" />
              <div className="absolute inset-2 border border-dashed border-[#2D3B32]/25 rounded-full" />
            </div>
            <p className="text-xs text-[#2D3B32]/65 italic font-serif animate-pulse">
              ❧ Deciphering text inscriptions and drawing wisdom seals from the scroll...
            </p>
          </div>
        )}

        {/* Vintage Parchment mailbox container */}
        {!intelligenceLoading && (
          <div>
            {!intelligenceData ? (
              <div className="bg-[#FAF7F0] border border-dashed border-[#2D3B32]/20 p-8 rounded-xl text-center shadow-xs">
                <span className="font-serif text-3xl opacity-20 block select-none mb-3">✉</span>
                <h5 className="font-serif text-sm font-semibold text-[#2D3B32] uppercase">No Epistle Formed</h5>
                <p className="text-xs text-[#2D3B32]/50 leading-relaxed max-w-sm mx-auto mt-1 leading-relaxed font-serif">
                  "Nhạc chưa gảy, thư chưa vẽ. Nhấn nút để triệu hồi bức thư chiêm tinh tài chính của bạn."
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 3 Stylised Slide Gauge Indicators */}
                <div className="bg-[#FAF7F0] border border-[#2D3B32]/12 p-6 rounded-xl space-y-4 shadow-sm">
                  <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#2D3B32] border-b border-[#2D3B32]/10 pb-1.5 font-sans">
                    Psycho-Analytical Indicators • Cốt Cách Tài Chính
                  </h5>
                  
                  <div className="space-y-3.5 text-xs">
                    {/* Gauge 1: Savings Intention */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium font-serif leading-none">
                        <span className="text-[#3D523C]">Mầm Mống Tích Lũy (Savings Intention)</span>
                        <span className="font-mono">{intelligenceData.meters?.savings || 60}%</span>
                      </div>
                      <div className="w-full bg-[#E2EAE0] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#6B8467] rounded-full transition-all duration-500"
                          style={{ width: `${intelligenceData.meters?.savings || 60}%` }}
                        />
                      </div>
                    </div>

                    {/* Gauge 2: Impulsive Urge */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium font-serif leading-none">
                        <span className="text-[#8E4A3E]">Xanh Rêu Bốc Đồng (Impulsive Urge)</span>
                        <span className="font-mono">{intelligenceData.meters?.impulsive || 40}%</span>
                      </div>
                      <div className="w-full bg-[#E2EAE0] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E54B4B] rounded-full transition-all duration-500"
                          style={{ width: `${intelligenceData.meters?.impulsive || 40}%` }}
                        />
                      </div>
                    </div>

                    {/* Gauge 3: Balanced Intuition */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium font-serif leading-none">
                        <span className="text-[#735D1F]">Trực Giác Cân Bằng (Balanced Intention)</span>
                        <span className="font-mono">{intelligenceData.meters?.balanced || 65}%</span>
                      </div>
                      <div className="w-full bg-[#E2EAE0] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all duration-500"
                          style={{ width: `${intelligenceData.meters?.balanced || 65}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classical mailbox deckled sheet */}
                <div className="bg-[#FCF9F2] shadow-md border border-[#E9E1CE] p-8 rounded-lg relative overflow-hidden text-[#2D3B32]">
                  
                  {/* Decorative faint background watermark */}
                  <div className="absolute top-2 right-4 pointer-events-none text-[#2D3B32]/5 select-none font-serif text-8xl italic">
                    ❦
                  </div>

                  {/* Header of Letter */}
                  <div className="border-b border-[#2D3B32]/12 pb-3 mb-6 flex justify-between items-baseline">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#2D3B32]/45">
                      Epistolary #AI-{Math.floor(Math.random() * 9000 + 1000)}
                    </span>
                    <span className="font-serif italic text-xs">
                      Archetype: <strong className="text-[#6B8467] font-semibold">{intelligenceData.archetype || 'Uncharted Sage'}</strong>
                    </span>
                  </div>

                  {/* Content message of Letter */}
                  <div className="space-y-4 font-serif text-xs leading-relaxed text-[#2D3B32]/85 text-justify">
                    {(intelligenceData.letter || '')
                      .split('\n\n')
                      .filter(Boolean)
                      .map((para, pCount) => (
                        <p key={pCount} className="first-letter:text-sm first-letter:font-bold">
                          {para}
                        </p>
                      ))}
                  </div>

                  {/* Cursive Signature & Red Wax Seal ornament */}
                  <div className="pt-8 mt-8 border-t border-[#2D3B32]/10 flex justify-between items-center relative">
                    <div className="font-serif italic text-xs space-y-1">
                      <p className="text-[10px] text-[#2D3B32]/50 font-mono tracking-wider uppercase leading-none">Respectfully,</p>
                      <p className="font-semibold text-[#2D3B32] mt-1 pr-6 border-b border-[#2D3B32]/30 inline-block">The Gemini Elder</p>
                    </div>

                    {/* Wax Seal absolute SVG */}
                    <div className="shrink-0 relative select-none" title="Wabi-Sabi wax seal verification">
                      <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-85 hover:scale-105 transition-transform duration-300">
                        <path
                          fill="#A13E3E"
                          d="M 50 10 C 25 10 10 25 10 50 C 10 75 25 90 50 90 C 75 90 90 75 90 50 C 90 25 75 10 50 10 Z"
                          className="opacity-90"
                        />
                        <path
                          fill="#8C3030"
                          d="M 50 15 C 30 15 15 30 15 50 C 15 70 30 85 50 85 C 70 85 85 70 85 50 C 85 30 70 15 50 15 Z"
                        />
                        {/* Cursive initials representation */}
                        <text
                          x="50"
                          y="58"
                          fontSize="18"
                          fontStyle="italic"
                          fontFamily="Georgia, serif"
                          fill="#FEF5D9"
                          textAnchor="middle"
                          fontWeight="bold"
                          className="opacity-80"
                        >
                          tachi.
                        </text>
                      </svg>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
