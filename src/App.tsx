import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Trophy, 
  Terminal, 
  User, 
  Flag, 
  Lock, 
  ChevronRight, 
  Search, 
  AlertCircle,
  Menu,
  X,
  MessageSquare,
  Send,
  Info,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface UserData {
  id: number;
  unique_id: string;
  username: string;
  role: string;
  level: number;
  gold_points: number;
  silver_points: number;
  bronze_points: number;
}

interface Badge {
  id: number;
  name: string;
  category: string;
  level: number;
  issued_at: string;
}

interface Certificate {
  id: number;
  category: string;
  level_range: string;
  certificate_code: string;
  issued_at: string;
}

interface ScoreEntry {
  username: string;
  unique_id: string;
  level: number;
  gold_points: number;
  silver_points: number;
  bronze_points: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  difficulty: string;
  level: number;
  hints: string;
  unlocked: number;
  solved: number;
  prerequisite_id: number | null;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read: number;
}

interface Struggle {
  title: string;
  failed_attempts: number;
}

// --- AI Service ---
import { GoogleGenAI } from "@google/genai";

const getAIProgressAnalysis = async (user: UserData, solvedCount: number, struggles: Struggle[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const struggleText = struggles.length > 0 
    ? `They are currently struggling with: ${struggles.map(s => `${s.title} (${s.failed_attempts} failed attempts)`).join(', ')}.`
    : "They are making steady progress with no major roadblocks.";

  const prompt = `Analyze the progress of a student in Hack_More_Tunnel (HMT). 
  Username: ${user.username}
  Unique ID: ${user.unique_id}
  Current Level: ${user.level}
  Challenges Solved: ${solvedCount}
  Gold Points: ${user.gold_points}
  Silver Points: ${user.silver_points}
  Bronze Points: ${user.bronze_points}
  
  ${struggleText}
  
  Provide a detailed, personalized, and motivating summary of their performance. 
  If they are struggling, give specific encouragement for those areas. 
  Suggest exactly what they should focus on next to reach the next level. 
  Keep it professional yet encouraging, under 150 words.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (err) {
    return "AI Mentor is currently offline. Keep hacking!";
  }
};

// --- Components ---

const AdminDashboard = ({ user }: { user: UserData }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [newChallenge, setNewChallenge] = useState({
    title: '', description: '', category: 'Cybersecurity', points: 100, flag: '', difficulty: 'Easy', level: 1, hints: '', prerequisite_id: ''
  });

  useEffect(() => {
    fetch('/api/admin/users').then(res => res.json()).then(setUsers);
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newChallenge, prerequisite_id: newChallenge.prerequisite_id || null })
    });
    if (res.ok) {
      alert('Challenge created!');
      setNewChallenge({ title: '', description: '', category: 'Cybersecurity', points: 100, flag: '', difficulty: 'Easy', level: 1, hints: '', prerequisite_id: '' });
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement)
    });
    if (res.ok) {
      alert('Announcement sent!');
      setAnnouncement({ title: '', message: '' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-white mb-8">Admin Control Center</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Challenge */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Flag className="w-5 h-5 text-emerald-500" /> Create New Challenge
          </h3>
          <form onSubmit={handleCreateChallenge} className="space-y-4">
            <input 
              type="text" placeholder="Title" required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
              value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})}
            />
            <textarea 
              placeholder="Description" required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white h-24"
              value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" placeholder="Category" required
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
                value={newChallenge.category} onChange={e => setNewChallenge({...newChallenge, category: e.target.value})}
              />
              <input 
                type="number" placeholder="Points" required
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
                value={newChallenge.points} onChange={e => setNewChallenge({...newChallenge, points: parseInt(e.target.value)})}
              />
            </div>
            <input 
              type="text" placeholder="Flag" required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
              value={newChallenge.flag} onChange={e => setNewChallenge({...newChallenge, flag: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
                value={newChallenge.difficulty} onChange={e => setNewChallenge({...newChallenge, difficulty: e.target.value})}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
                <option>Professional</option>
              </select>
              <input 
                type="number" placeholder="Level (1-10)" required
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
                value={newChallenge.level} onChange={e => setNewChallenge({...newChallenge, level: parseInt(e.target.value)})}
              />
            </div>
            <input 
              type="number" placeholder="Prerequisite Challenge ID (Optional)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
              value={newChallenge.prerequisite_id} onChange={e => setNewChallenge({...newChallenge, prerequisite_id: e.target.value})}
            />
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all">
              Deploy Challenge
            </button>
          </form>
        </div>

        <div className="space-y-8">
          {/* Announcements */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" /> Global Announcement
            </h3>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <input 
                type="text" placeholder="Title" required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white"
                value={announcement.title} onChange={e => setAnnouncement({...announcement, title: e.target.value})}
              />
              <textarea 
                placeholder="Message" required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white h-24"
                value={announcement.message} onChange={e => setAnnouncement({...announcement, message: e.target.value})}
              />
              <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all">
                Broadcast to All Users
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" /> User Management
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div>
                    <div className="text-sm font-bold text-white">{u.username}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{u.unique_id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-emerald-500">{u.role}</div>
                    <div className="text-xs text-zinc-400">LVL {u.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressDashboard = ({ user, challenges }: { user: UserData, challenges: Challenge[] }) => {
  const solved = challenges.filter(c => c.solved);
  const totalPoints = user.gold_points + user.silver_points + user.bronze_points;
  
  const categories = Array.from(new Set(challenges.map(c => c.category)));
  const categoryStats = categories.map(cat => {
    const catChallenges = challenges.filter(c => c.category === cat);
    const solvedCat = catChallenges.filter(c => c.solved).length;
    return { name: cat, total: catChallenges.length, solved: solvedCat };
  });

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm mb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Operational Progress</h2>
          <p className="text-zinc-500 text-sm">Real-time analysis of your cybersecurity journey.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-2xl">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Points</div>
            <div className="text-xl font-bold text-emerald-500">{totalPoints.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-2xl">
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Completion</div>
            <div className="text-xl font-bold text-white">{Math.round((solved.length / challenges.length) * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryStats.map(stat => (
          <div key={stat.name} className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{stat.name}</span>
              <span className="text-xs text-zinc-500">{stat.solved}/{stat.total}</span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(stat.solved / stat.total) * 100}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em]">Level Progression</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
        <div className="flex justify-between items-end h-32 gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(lvl => (
            <div key={lvl} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "w-full rounded-t-lg transition-all duration-500",
                  user.level >= lvl ? "bg-emerald-500/40 border-t-2 border-emerald-500" : "bg-zinc-900/50 border-t border-zinc-800"
                )}
                style={{ height: `${lvl * 10}%` }}
              />
              <span className={cn("text-[10px] font-bold", user.level >= lvl ? "text-emerald-500" : "text-zinc-600")}>L{lvl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ user, onNavigate, onLogout, currentPage }: { user: UserData | null, onNavigate: (page: string) => void, onLogout: () => void, currentPage: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <img 
              src="https://img.icons8.com/ios-filled/100/ffffff/tunnel.png" 
              alt="HMT Logo" 
              className="w-10 h-10 object-contain" 
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold tracking-tighter text-white">HMT <span className="text-emerald-500">TUNNEL</span></span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <div className="relative group">
                <button className="text-zinc-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                  English <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {['English', 'Deutsch', 'Français', 'Español'].map(lang => (
                    <button key={lang} className="w-full text-left px-4 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => onNavigate('challenges')} className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Challenges</button>
              <button onClick={() => onNavigate('scoreboard')} className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Scoreboard</button>
              {user && <button onClick={() => onNavigate('achievements')} className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Achievements</button>}
              {user?.role === 'admin' && <button onClick={() => onNavigate('admin')} className="text-emerald-400 hover:text-emerald-300 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-emerald-500/20 bg-emerald-500/5">Admin</button>}
              <button className="text-zinc-400 hover:text-white p-2 rounded-full transition-colors ml-2" title="Toggle theme">
                <Zap className="w-4 h-4" />
              </button>
              {user ? (
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-zinc-800">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold text-white">{user.username}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">LVL {user.level}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{user.unique_id}</span>
                  </div>
                  <button onClick={onLogout} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all">Logout</button>
                </div>
              ) : (
                <button onClick={() => onNavigate('login')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-emerald-900/20">Login</button>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-zinc-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => { onNavigate('challenges'); setIsOpen(false); }} className="text-zinc-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Challenges</button>
              <button onClick={() => { onNavigate('scoreboard'); setIsOpen(false); }} className="text-zinc-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Scoreboard</button>
              {user && <button onClick={() => { onNavigate('achievements'); setIsOpen(false); }} className="text-zinc-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Achievements</button>}
              {user ? (
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-red-400 hover:text-red-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left">Logout</button>
              ) : (
                <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="text-emerald-400 hover:text-emerald-300 block px-3 py-2 rounded-md text-base font-medium w-full text-left">Login</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-emerald-500" />
          <span className="text-lg font-bold text-white">Hack_More_Tunnel (HMT)</span>
        </div>
        <p className="text-zinc-500 text-sm">
          Empowering the next generation of cybersecurity experts through hands-on practice and competitive learning.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Developer</h4>
        <p className="text-zinc-400 text-sm mb-1">Xavier Wrld</p>
        <div className="flex gap-3 mt-4">
          <a 
            href="https://wa.me/254104654171" 
            target="_blank" 
            rel="noreferrer" 
            className="p-2.5 rounded-xl bg-zinc-900 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-all border border-zinc-800"
            title="WhatsApp"
          >
            <MessageSquare className="w-5 h-5" />
          </a>
          <a 
            href="https://t.me/+254104654171" 
            target="_blank" 
            rel="noreferrer" 
            className="p-2.5 rounded-xl bg-zinc-900 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 transition-all border border-zinc-800"
            title="Telegram"
          >
            <Send className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm text-zinc-500">
          <li><a href="#" className="hover:text-emerald-400">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-emerald-400">Terms of Service</a></li>
          <li><a href="#" className="hover:text-emerald-400">Rules</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-xs">
      &copy; {new Date().getFullYear()} Hack_More_Tunnel (HMT). All rights reserved.
    </div>
  </footer>
);

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('ctf_user');
    if (savedUser && savedUser !== 'undefined') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('ctf_user');
      }
    }

    // WebSocket Setup
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'SCOREBOARD_UPDATE') {
          setScoreboard(message.data);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    };

    return () => socket.close();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const url = user ? `/api/challenges?userId=${user.id}` : '/api/challenges';
      const res = await fetch(url);
      const data = await res.json();
      setChallenges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('ctf_user', JSON.stringify(data));
        setCurrentPage('challenges');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('ctf_user', JSON.stringify(data));
        setCurrentPage('challenges');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Registration failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ctf_user');
    setCurrentPage('home');
  };

  const submitFlag = async (challengeId: number, flag: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, challengeId, flag }),
      });
      const data = await res.json();
      if (data.correct) {
        fetchChallenges();
      }
      return data.correct;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-emerald-500/30">
      <Navbar user={user} onLogout={handleLogout} onNavigate={setCurrentPage} currentPage={currentPage} />

      <main className="pt-16">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-4 py-20"
            >
              <div className="text-center mb-20">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6"
                >
                  <Terminal className="w-3 h-3" />
                  <span>PREPARATORY SIMULATOR FOR STUDENTS</span>
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
                  Master the Art of <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Ethical Hacking</span>
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
                  Join Hack_More_Tunnel (HMT) to sharpen your skills in web exploitation, cryptography, reverse engineering, and more. A safe, competitive environment for beginners and pros alike.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-20">
                  <button 
                    onClick={() => setCurrentPage(user ? 'challenges' : 'login')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-2"
                  >
                    Get Started <ChevronRight className="w-5 h-5" />
                  </button>
                  <button className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 px-8 py-3 rounded-full font-bold transition-all">
                    View Rules
                  </button>
                </div>

                <div className="max-w-4xl mx-auto text-left bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Info className="w-5 h-5 text-emerald-500" /> Important Information
                  </h3>
                  <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                    <p>1. The flag format is <code className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">HMT{`{...}`}</code> unless specified otherwise.</p>
                    <p>2. Scenarios consist of a series of tasks. After completing one task, the next one is unlocked. Depending on the scenario, a task may follow up on the previous one.</p>
                    <p>3. In some scenarios — especially in forensics — you may find the flag for the next task before completing the current one. If you find a flag but the platform marks it as incorrect, keep it for the next task in the scenario.</p>
                    <p>4. Join our community to stay updated and get support.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                {[
                  { icon: Lock, title: "Test your skills", desc: "Solve challenges from various areas of cybersecurity and build your practical knowledge." },
                  { icon: Trophy, title: "Compete", desc: "Climb the leaderboard and prove your expertise against other cybersecurity professionals." },
                  { icon: Info, title: "Learn", desc: "Develop new skills through practical challenges designed by industry experts." }
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/30 transition-all group"
                  >
                    <feature.icon className="w-10 h-10 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentPage === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto px-4 py-20"
            >
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                  <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                  <p className="text-zinc-500 text-sm">Sign in to continue your journey</p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Username</label>
                    <input 
                      name="username"
                      type="text" 
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Password</label>
                    <input 
                      name="password"
                      type="password" 
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 mt-4">
                    Sign In
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
                  <p className="text-zinc-500 text-sm">
                    Don't have an account? <button onClick={() => setCurrentPage('register')} className="text-emerald-400 hover:underline">Register</button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto px-4 py-20"
            >
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="text-center mb-8">
                  <User className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white">Join the CTF</h2>
                  <p className="text-zinc-500 text-sm">Create an account to start hacking</p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Username</label>
                    <input 
                      name="username"
                      type="text" 
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Choose a username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Password</label>
                    <input 
                      name="password"
                      type="password" 
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Create a password"
                    />
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 mt-4">
                    Create Account
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
                  <p className="text-zinc-500 text-sm">
                    Already have an account? <button onClick={() => setCurrentPage('login')} className="text-emerald-400 hover:underline">Sign In</button>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'challenges' && (
            <ChallengesView 
              user={user} 
              onFetch={fetchChallenges} 
              challenges={challenges} 
              onSubmit={submitFlag}
            />
          )}

          {currentPage === 'scoreboard' && (
            <ScoreboardView scoreboard={scoreboard} />
          )}

          {currentPage === 'achievements' && user && (
            <AchievementsView user={user} />
          )}

          {currentPage === 'admin' && user?.role === 'admin' && (
            <AdminDashboard user={user} />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

const AchievementsView = ({ user }: { user: UserData }) => {
  const [data, setData] = useState<{ badges: Badge[], certificates: Certificate[], user: any, notifications: Notification[], struggles: Struggle[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetch(`/api/user/achievements/${user.id}`)
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      });
  }, [user.id]);

  const handleAIAnalysis = async () => {
    if (!data) return;
    setAnalyzing(true);
    const analysis = await getAIProgressAnalysis(user, data.badges.length, data.struggles);
    setAiAnalysis(analysis);
    setAnalyzing(false);
  };

  if (loading) return <div className="text-center py-20 text-zinc-500">Loading achievements...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Notifications */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" /> Notifications
            </h3>
            <div className="space-y-4">
              {data?.notifications.length === 0 ? (
                <p className="text-zinc-500 text-sm">No new notifications.</p>
              ) : (
                data?.notifications.map(n => (
                  <div key={n.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      n.type === 'level_up' ? "bg-emerald-500/10 text-emerald-500" :
                      n.type === 'challenge' ? "bg-blue-500/10 text-blue-500" :
                      "bg-zinc-800 text-zinc-400"
                    )}>
                      {n.type === 'level_up' ? <Trophy className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{n.message}</p>
                      <span className="text-[10px] text-zinc-600 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> Earned Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data?.badges.map(badge => (
                <div key={badge.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-center group hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-xs font-bold text-white mb-1">{badge.name}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">{badge.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* AI Mentor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" /> AI Mentor
              </h3>
              <button 
                onClick={handleAIAnalysis}
                disabled={analyzing}
                className="text-xs font-bold text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
              </button>
            </div>
            
            <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 min-h-[200px] flex flex-col">
              {aiAnalysis ? (
                <div className="text-sm text-zinc-400 leading-relaxed italic">
                  "{aiAnalysis}"
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-800 mb-3" />
                  <p className="text-xs text-zinc-600">Click refresh to get personalized feedback from your AI Mentor.</p>
                </div>
              )}
            </div>

            {data?.struggles.length && data.struggles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3">Targeted Focus Areas</h4>
                <div className="space-y-2">
                  {data.struggles.map(s => (
                    <div key={s.title} className="flex items-center justify-between text-xs p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                      <span className="text-zinc-400">{s.title}</span>
                      <span className="text-red-400 font-bold">{s.failed_attempts} fails</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CertificateCard = ({ cert, username }: { cert: Certificate, username: string }) => {
  return (
    <div className="relative p-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-zinc-800 overflow-hidden group">
      <div className="bg-zinc-950 p-8 rounded-[22px] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -ml-16 -mb-16" />
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://img.icons8.com/ios-filled/100/ffffff/tunnel.png" 
                alt="Logo" 
                className="w-8 h-8 object-contain" 
                referrerPolicy="no-referrer"
              />
              <span className="text-sm font-bold text-zinc-400 tracking-widest uppercase">Hack_More_Tunnel (HMT)</span>
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Certificate of Achievement</h4>
            <p className="text-zinc-500 text-sm mb-6">This is to certify that</p>
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-6">
              {username.toUpperCase()}
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              Has successfully demonstrated mastery in <span className="text-white font-bold">{cert.category}</span> at the <span className="text-white font-bold">{cert.level_range}</span> level.
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="w-24 h-24 border-4 border-emerald-500/20 rounded-full flex items-center justify-center relative">
              <Shield className="w-10 h-10 text-emerald-500" />
              <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full animate-pulse" />
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Verification Code</div>
              <div className="text-xs font-mono text-zinc-400">{cert.certificate_code}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">Issued On</div>
              <div className="text-xs text-zinc-400">{new Date(cert.issued_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
      <button className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-800">
        Download PDF
      </button>
    </div>
  );
};

const ChallengesView = ({ user, onFetch, challenges, onSubmit }: { user: UserData | null, onFetch: () => void, challenges: Challenge[], onSubmit: (id: number, flag: string) => Promise<boolean> }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    onFetch();
  }, []);

  const categories = ['All', ...Array.from(new Set(challenges.map(c => c.category)))];
  const filteredChallenges = challenges.filter(c => 
    (selectedCategory === 'All' || c.category === selectedCategory) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {user && <ProgressDashboard user={user} challenges={challenges} />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tighter">OPERATIONAL THEATER</h2>
          <p className="text-zinc-500">Select a target and execute your strategy.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search challenges..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map(challenge => (
          <ChallengeCard key={challenge.id} challenge={challenge} onSubmit={onSubmit} />
        ))}
      </div>
    </div>
  );
};

const ChallengeCard = ({ challenge, onSubmit }: { challenge: Challenge, onSubmit: (id: number, flag: string) => Promise<boolean> }) => {
  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'correct' | 'wrong'>('idle');

  const getLevelLabel = (level: number) => {
    if (level <= 3) return { label: 'Beginner', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (level <= 6) return { label: 'Intermediate', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (level <= 8) return { label: 'Advanced', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    return { label: 'Master', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  };

  const levelInfo = getLevelLabel(challenge.level);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag || status === 'loading') return;
    setStatus('loading');
    const correct = await onSubmit(challenge.id, flag);
    setStatus(correct ? 'correct' : 'wrong');
    if (!correct) {
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <motion.div 
      layout
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden transition-all",
        status === 'correct' ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10" : "hover:border-zinc-700"
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
            levelInfo.bg, levelInfo.color, levelInfo.border
          )}>
            {levelInfo.label} (LVL {challenge.level})
          </div>
          <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">{challenge.category}</span>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2">{challenge.title}</h3>
        <p className="text-zinc-500 text-sm mb-6 line-clamp-2">{challenge.description}</p>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-white font-bold text-sm">{challenge.points}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-zinc-400 text-xs">{challenge.difficulty}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder={challenge.unlocked ? "HMT{flag_here}" : "Challenge Locked"}
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              disabled={status === 'correct' || !challenge.unlocked}
              className={cn(
                "w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none transition-all",
                status === 'correct' ? "border-emerald-500 text-emerald-500" : 
                status === 'wrong' ? "border-red-500 text-red-500" : 
                !challenge.unlocked ? "border-zinc-800 bg-zinc-900/50 cursor-not-allowed text-zinc-600" :
                "border-zinc-800 text-white focus:border-emerald-500"
              )}
            />
            {status === 'correct' && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
            {status === 'wrong' && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
            {!challenge.unlocked && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />}
          </div>
          <button 
            type="submit"
            disabled={status === 'loading' || status === 'correct' || !flag || !challenge.unlocked}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {status === 'loading' ? 'Verifying...' : status === 'correct' ? 'Solved' : !challenge.unlocked ? 'Locked' : 'Submit Flag'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

const ScoreboardView = ({ scoreboard }: { scoreboard: any[] }) => {
  return (
    <motion.div
      key="scoreboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <div className="text-center mb-12">
        <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-4xl font-bold text-white mb-2 tracking-tighter">HALL OF FAME</h2>
        <p className="text-zinc-500">The top operators in the Hack_More_Tunnel (HMT) ecosystem.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800">
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Rank</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Operator</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Level</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest text-right">Points (G/S/B)</th>
            </tr>
          </thead>
          <tbody>
            {scoreboard.map((entry, index) => (
              <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-amber-500 text-amber-950" : 
                    index === 1 ? "bg-zinc-300 text-zinc-950" :
                    index === 2 ? "bg-amber-700 text-amber-50" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-bold group-hover:text-emerald-400 transition-colors">{entry.username}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{entry.unique_id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-emerald-500 font-bold">LVL {entry.level}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 font-bold">{entry.gold_points}</span>
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-300 font-bold">{entry.silver_points}</span>
                      <div className="w-2 h-2 rounded-full bg-zinc-300" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-700 font-bold">{entry.bronze_points}</span>
                      <div className="w-2 h-2 rounded-full bg-amber-700" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
