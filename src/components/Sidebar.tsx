import React from 'react';
import { LogOut, User, PenTool, Check } from 'lucide-react';

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

interface Profile {
  nickname: string;
  avatarUrl: string;
  bio: string;
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
  profile: Profile;
  recurringRules: RecurringRule[];
}

interface SidebarProps {
  currentUser: string | null;
  data: FinancialData;
  activeView: 'overview' | 'ledger' | 'jars' | 'automation' | 'intelligence' | 'calculator';
  setActiveView: (view: 'overview' | 'ledger' | 'jars' | 'automation' | 'intelligence' | 'calculator') => void;
  handleSignOut: () => void;
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  profileNickname: string;
  setProfileNickname: (val: string) => void;
  profileAvatarUrl: string;
  setProfileAvatarUrl: (val: string) => void;
  profileBio: string;
  setProfileBio: (val: string) => void;
  handleUpdateProfile: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  data,
  activeView,
  setActiveView,
  handleSignOut,
  isEditingProfile,
  setIsEditingProfile,
  profileNickname,
  setProfileNickname,
  profileAvatarUrl,
  setProfileAvatarUrl,
  profileBio,
  setProfileBio,
  handleUpdateProfile,
  submitting,
}) => {
  const menuItems = [
    { id: 'overview', label: 'Overview & Balance', icon: '✦' },
    { id: 'ledger', label: 'Visual Ledger', icon: '✿' },
    { id: 'jars', label: 'Jars Designer', icon: '❦' },
    { id: 'automation', label: 'Recurring Automation', icon: '❧' },
    { id: 'intelligence', label: 'Gemini Intelligence', icon: '✨' },
    { id: 'calculator', label: 'Freedom Calculator', icon: '🧮' },
  ] as const;

  const currentAvatar = data.profile?.avatarUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150';
  const currentNickname = data.profile?.nickname || 'Anonymous Journaler';
  const currentBio = data.profile?.bio || 'Quietly writing down where life flows.';

  return (
    <aside className="w-full md:w-[25vw] h-auto md:h-screen bg-[#E2EAE0] px-6 py-8 border-r border-[#2D3B32]/10 md:sticky md:top-0 flex flex-col justify-between" id="dashboard-sidebar">
      <div className="space-y-6">
        {/* Branding Logo */}
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-normal text-[#2D3B32] select-none lowercase">
            tachi.
          </h1>
          <span className="text-[10px] tracking-widest text-[#2D3B32]/40 italic block uppercase">
            est. 2026 / financial journal
          </span>
        </div>

        {/* User Portfolio Panel with hand-drawn style */}
        <div className="p-4 border border-[#2D3B32]/15 bg-[#FDFBF7]/60 rounded-xl space-y-3 relative shadow-xs" id="portfolio-panel">
          {!isEditingProfile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {/* Vintage Wreath style wrapper */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#2D3B32]/30 bg-[#FDFBF7] shrink-0 select-none">
                  <img
                    src={currentAvatar}
                    alt={currentNickname}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-[#2D3B32]/40 uppercase tracking-widest leading-none">Journaler</p>
                  <h4 className="text-sm font-serif text-[#2D3B32] font-semibold truncate leading-tight mt-1">
                    {currentNickname}
                  </h4>
                </div>
              </div>
              <p className="text-[11px] text-[#2D3B32]/70 italic leading-relaxed font-serif">
                "{currentBio}"
              </p>
              <div className="pt-1.5 flex justify-between items-center text-[10px] text-[#2D3B32]/40 font-mono">
                <span className="truncate max-w-[120px]" title={currentUser || ''}>@{currentUser}</span>
                <button
                  onClick={() => {
                    setProfileNickname(currentNickname);
                    setProfileAvatarUrl(currentAvatar);
                    setProfileBio(currentBio);
                    setIsEditingProfile(true);
                  }}
                  className="text-[#2D3B32] hover:text-[#6B8467] font-bold border-b border-[#2D3B32]/30 pb-0.5"
                  title="Rewrite journal identity"
                >
                  [ Edit Profile ]
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#2D3B32]">Edit Identity</h5>
              
              <div className="space-y-1">
                <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-wider">Nickname</label>
                <input
                  type="text"
                  required
                  value={profileNickname}
                  onChange={(e) => setProfileNickname(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded px-2 py-1 text-xs text-[#2D3B32] focus:outline-none focus:border-[#6B8467]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-wider">Bio Mantra</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={2}
                  maxLength={100}
                  className="w-full bg-[#FDFBF7] border border-[#2D3B32]/20 rounded px-2 py-1 text-xs text-[#2D3B32] focus:outline-none focus:border-[#6B8467] resize-none"
                />
              </div>

              {/* Grid selectors mimicking classical illustrations */}
              <div className="space-y-1">
                <label className="block text-[8px] uppercase font-bold text-[#2D3B32]/60 tracking-wider">Style Sketch</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=150', label: 'Lotus' },
                    { url: 'https://images.unsplash.com/photo-1549880181-56a44cf8a4a1?w=150', label: 'Fern' },
                    { url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=150', label: 'Moss' },
                    { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=150', label: 'River' }
                  ].map((sketch, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setProfileAvatarUrl(sketch.url)}
                      className={`relative aspect-square rounded overflow-hidden border transition-all ${
                        profileAvatarUrl === sketch.url ? 'border-[#6B8467] scale-105' : 'border-[#2D3B32]/10 opacity-70'
                      }`}
                      title={sketch.label}
                    >
                      <img src={sketch.url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 bg-transparent hover:bg-[#2D3B32]/10 text-[#2D3B32] border border-[#2D3B32]/30 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#6B8467] hover:bg-[#4E634A] text-[#FDFBF7] py-1.5 rounded text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-2.5 h-2.5" />
                  Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar Nav menu list items */}
        <nav className="space-y-1.5 pt-2" id="sidebar-menu">
          {menuItems.map((item) => {
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full text-left font-sans text-xs tracking-wider uppercase py-3 px-4 flex items-center gap-3 transition-all duration-300 border-l-4 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#6B8467] text-[#FDFBF7] font-bold border-[#2D3B32] shadow-sm translate-x-1'
                    : 'text-[#2D3B32]/70 hover:text-[#2D3B32] hover:bg-[#D4DDD3]/50 border-transparent'
                }`}
              >
                <span className="text-sm shrink-0 font-serif leading-none opacity-85 select-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Area with Sign Out button */}
      <div className="pt-6 border-t border-[#2D3B32]/10 mt-auto">
        <button
          onClick={handleSignOut}
          className="w-full bg-[#2D3B32] hover:bg-[#1E2922] text-[#FDFBF7] font-bold text-xs uppercase tracking-widest py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex justify-center items-center gap-1.5"
          id="sign-out-button"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
