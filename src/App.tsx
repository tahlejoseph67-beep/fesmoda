import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote as VoteIcon, 
  Users, 
  LayoutDashboard, 
  Info, 
  Mail, 
  Handshake, 
  Menu, 
  X, 
  ChevronRight, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  CreditCard,
  Phone,
  Trophy,
  Award,
  Bell,
  CheckCircle2,
  Search,
  BookOpen,
  Edit as EditIcon,
  Plus,
  Trash2,
  LogIn
} from 'lucide-react';
import { auth, db } from './firebase';
import { seedDatabase } from './seedData';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, getDocFromServer, where, updateDoc, increment, getDocs, deleteDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { UserProfile, Candidate, Settings, Vote, AppNotification, Blog } from './types';
import { cn } from './lib/utils';

const VOTE_GOAL = 2000;

const adminEmails = ['contact@fesmoda.com', 'kaelsandeofficiel480@gmail.com', 'adminfesmoda@fesmoda.com'];
const isAdminEmail = (email: string | null) => email ? adminEmails.includes(email.toLowerCase()) : false;

// --- Components ---

const Navbar = ({ user, onLogin, notifications }: { user: UserProfile | null, onLogin: () => void, notifications: AppNotification[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.read) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    }
  };

  const navItems = [
    { name: 'Accueil', path: '/', icon: <ChevronRight className="w-4 h-4" /> },
    { name: 'Candidats', path: '/candidates', icon: <Users className="w-4 h-4" /> },
    { name: 'Stats Live', path: '/stats', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Qui sommes-nous?', path: '/about', icon: <Info className="w-4 h-4" /> },
    { name: 'Partenaires', path: '/partners', icon: <Handshake className="w-4 h-4" /> },
    { name: 'Contact', path: '/contact', icon: <Mail className="w-4 h-4" /> },
    ...(!user ? [{ name: 'Connexion', path: '/login', icon: <LogIn className="w-4 h-4" /> }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-400 bg-clip-text text-transparent"
            >
              FESMODA
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-pink-600",
                  location.pathname === item.path ? "text-pink-600" : "text-gray-600"
                )}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications && unreadCount > 0) markAllAsRead();
                    }}
                    className="p-2 text-gray-400 hover:text-pink-600 transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-pink-50 bg-pink-50/50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-900">Notifications</h3>
                          <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">{notifications.length} Total</span>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm italic">
                              Aucune notification
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div key={n.id} className={cn("p-4 border-b border-pink-50 transition-colors", !n.read ? "bg-pink-50/30" : "hover:bg-gray-50")}>
                                <div className="flex items-start space-x-3">
                                  <div className={cn("mt-1 w-2 h-2 rounded-full flex-shrink-0", n.type === 'vote' ? "bg-green-500" : n.type === 'status' ? "bg-blue-500" : "bg-pink-500")} />
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString()} à {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/profile"
                  className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                  title="Mon Profil"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="px-6 py-2 rounded-full border-2 border-pink-600 text-pink-600 text-sm font-medium hover:bg-pink-50 transition-all"
              >
                Connexion
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-4">
            {user && unreadCount > 0 && (
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" />
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-pink-100 px-4 py-6 space-y-4"
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="block text-lg font-medium text-gray-700 hover:text-pink-600"
              >
                {item.name}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block text-lg font-medium text-gray-700 hover:text-pink-600"
                >
                  Mon Profil
                </Link>
                <button 
                  onClick={() => {
                    signOut(auth);
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-lg font-medium text-red-500 hover:text-red-600 pt-4 border-t border-gray-100"
                >
                  Déconnexion
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
}

const slides: Slide[] = [
  {
    image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=1920&q=80",
    title: "FESMODA 2026",
    subtitle: "L'Événement de Mode & d'Art Incontournable.",
    desc: "Soutenez la créativité locale en votant pour l'excellence et l'élégance de nos créateurs africains.",
    badge: "Édition 2026"
  },
  {
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1920&q=80",
    title: "ART ET IDENTITÉ",
    subtitle: "La mode comme un langage universel.",
    desc: "Explorez des créations uniques qui fusionnent traditions ancestrales et tendances modernes.",
    badge: "Créativité & Innovation"
  },
  {
    image: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&w=1920&q=80",
    title: "VOTRE VOTE COMPTE",
    subtitle: "Soutenez vos créateurs préférés.",
    desc: "Chaque vote propulse un artiste ou designer africain vers la scène internationale et le PRIX D'OR.",
    badge: "Propulsion de Talents"
  }
];

const defaultBlogs: Blog[] = [
  {
    id: 'default-1',
    title: "Lancement Officiel FESMODA 2026",
    content: "Le coup d'envoi de l'édition 2026 a été donné à Abomey-Calavi. Une année placée sous le signe de l'innovation.",
    image: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&w=800&q=80",
    date: "25 Mars 2026",
    author: "Équipe FESMODA",
    createdAt: "2026-03-25T10:00:00.000Z"
  },
  {
    id: 'default-2',
    title: "Appel aux Créateurs",
    content: "Vous êtes designer ou artiste ? Les inscriptions sont désormais ouvertes pour rejoindre l'aventure.",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80",
    date: "28 Mars 2026",
    author: "Comité de Sélection",
    createdAt: "2026-03-28T10:00:00.000Z"
  },
  {
    id: 'default-3',
    title: "Nouveaux Partenaires",
    content: "Nous sommes fiers d'accueillir de nouveaux partenaires stratégiques pour cette édition exceptionnelle.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    date: "30 Mars 2026",
    author: "Relations Publiques",
    createdAt: "2026-03-30T10:00:00.000Z"
  }
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={slides[current].image} 
            alt={slides[current].title} 
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-white" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-pink-600 text-[10px] font-black uppercase tracking-widest mb-6 shadow-md">
              {slides[current].badge}
            </span>
            <h1 className="text-5xl md:text-8xl font-black leading-tight mb-4 drop-shadow-2xl uppercase tracking-tight">
              {slides[current].title}
            </h1>
            <p className="text-xl md:text-3xl text-pink-100 font-bold max-w-3xl mx-auto mb-4 drop-shadow-lg leading-relaxed">
              {slides[current].subtitle}
            </p>
            <p className="text-sm md:text-base text-gray-200 max-w-2xl mx-auto mb-10 font-medium drop-shadow-md">
              {slides[current].desc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/candidates" className="w-full sm:w-auto px-10 py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-pink-900/20 hover:scale-105 hover:bg-pink-700 transition-all">
                Voter Maintenant
              </Link>
              <Link to="/about" className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors">
                En savoir plus
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              idx === current ? "bg-pink-600 w-8" : "bg-white/50 hover:bg-white"
            )}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Prev/Next arrows */}
      <button 
        onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 md:opacity-100"
      >
        &#8592;
      </button>
      <button 
        onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 md:opacity-100"
      >
        &#8594;
      </button>
    </div>
  );
};

const Home = ({ blogs }: { blogs: Blog[] }) => {
  const displayBlogs = blogs.length > 0 ? blogs : defaultBlogs;
  return (
    <div className="relative">
      {/* Slider Header */}
      <HeroSlider />

    {/* Features Section */}
    <div className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid md:grid-cols-3 gap-12">
        <motion.div 
          whileHover={{ y: -10 }}
          className="text-center p-8 rounded-3xl bg-gray-50 border border-gray-100"
        >
          <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="text-pink-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-4">Talents Locaux</h3>
          <p className="text-gray-600">Découvrez les meilleurs créateurs et artistes qui façonnent l'avenir de la mode.</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -10 }}
          className="text-center p-8 rounded-3xl bg-gray-50 border border-gray-100"
        >
          <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <VoteIcon className="text-pink-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-4">Vote Transparent</h3>
          <p className="text-gray-600">Un système de vote sécurisé et équitable pour garantir l'intégrité de l'événement.</p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -10 }}
          className="text-center p-8 rounded-3xl bg-gray-50 border border-gray-100"
        >
          <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Handshake className="text-pink-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-4">Partenariats</h3>
          <p className="text-gray-600">Une collaboration étroite avec les acteurs majeurs pour propulser nos talents.</p>
        </motion.div>
      </div>
    </div>

    {/* Prizes Section */}
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Nos Récompenses</h2>
          <p className="text-pink-600 font-bold uppercase tracking-widest text-sm">Prix à gagner pour cet édition</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-pink-100 max-w-5xl mx-auto group"
        >
          <img 
            src="https://images.unsplash.com/photo-1561406636-b8029a7a81cf?auto=format&fit=crop&w=1600&q=80" 
            alt="Prix FESMODA 2026" 
            className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center p-8 md:p-16">
            <div className="text-center max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-white text-3xl md:text-5xl font-black mb-6 drop-shadow-2xl">
                  iPhone, Enveloppes Financières, Formations & Plus
                </h3>
                <p className="text-pink-100 text-lg font-medium drop-shadow-lg">
                  Récompenser l'excellence et propulser les nouveaux talents de la mode béninoise.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Blog Section */}
    <div className="bg-pink-50/50 py-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Actualités & Blog</h2>
          <p className="text-gray-500 mt-2">Suivez le lancement de FESMODA ÉDITION 2026.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayBlogs.map((post, i) => (
            <motion.div 
              key={post.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-pink-100 hover:shadow-xl transition-all group"
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6">
                <span className="text-pink-600 text-xs font-bold uppercase tracking-wider">{post.date}</span>
                <h3 className="text-xl font-bold mt-2 mb-3 text-gray-900">{post.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">{post.content}</p>
                <button className="text-pink-600 font-bold text-sm flex items-center hover:translate-x-2 transition-transform">
                  Lire la suite <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};

const Candidates = ({ candidates }: { candidates: Candidate[] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900">Nos Candidats</h2>
        <p className="text-gray-500 mt-2">Découvrez les talents qui façonnent l'avenir de la mode.</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-16">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un candidat par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-white border border-pink-100 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none shadow-sm hover:shadow-md transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
        {searchQuery && (
          <p className="mt-3 text-sm text-gray-500 text-center">
            {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''} trouvé{filteredCandidates.length > 1 ? 's' : ''} pour "{searchQuery}"
          </p>
        )}
      </div>

      {filteredCandidates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCandidates.map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-3xl border border-pink-50 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <Link to={`/candidate/${candidate.id}`} className="block aspect-[3/4] relative overflow-hidden">
                <img 
                  src={candidate.photoUrl || `https://picsum.photos/seed/${candidate.id}/600/800`} 
                  alt={candidate.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-pink-600">
                  {candidate.category}
                </div>
              </Link>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Link to={`/candidate/${candidate.id}`} className="text-xl font-bold text-gray-900 hover:text-pink-600 transition-colors">{candidate.name}</Link>
                  {candidate.isEligible && (
                    <span className="flex items-center space-x-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Éligible</span>
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">{candidate.voteCount} votes</span>
                  </div>
                  <Link 
                    to={`/vote/${candidate.id}`}
                    className="px-6 py-2 bg-pink-600 text-white rounded-xl text-sm font-bold hover:bg-pink-700 transition-colors"
                  >
                    Voter
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-pink-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Aucun candidat trouvé</h3>
          <p className="text-gray-500 mt-2">Essayez d'ajuster votre recherche pour trouver ce que vous cherchez.</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-6 text-pink-600 font-bold hover:underline"
          >
            Effacer la recherche
          </button>
        </div>
      )}
    </div>
  );
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Une erreur est survenue.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error.includes("insufficient permissions")) {
          errorMessage = "Permissions insuffisantes. Veuillez vous reconnecter ou contacter l'administrateur.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-pink-50">
          <X className="w-16 h-16 text-pink-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups !</h1>
          <p className="text-gray-600 mb-6 max-w-md">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoginModal = ({ onClose, onEmailLogin, onGoogleLogin }: { onClose: () => void, onEmailLogin: (email: string, pass: string) => void, onGoogleLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="p-10 pt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Connexion</h2>
            <p className="text-gray-500">Accédez à votre espace FESMODA</p>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
            <button 
              onClick={() => setIsEmailLogin(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isEmailLogin ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Email
            </button>
            <button 
              onClick={() => setIsEmailLogin(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isEmailLogin ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Google
            </button>
          </div>

          {isEmailLogin ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Identifiant ou e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Identifiant ou e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Mot de passe</label>
                <div className="relative">
                  <X className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={() => onEmailLogin(email, password)}
                className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 mt-4"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={onGoogleLogin}
                className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center space-x-3"
              >
                <img src="https://www.google.com/favicon.ico" className="w-6 h-6" />
                <span>Continuer avec Google</span>
              </button>
              <p className="text-center text-sm text-gray-500">
                Connectez-vous rapidement avec votre compte Google.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const LoginPage = ({ onEmailLogin, onGoogleLogin, user }: { onEmailLogin: (email: string, pass: string) => void, onGoogleLogin: () => void, user: UserProfile | null }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="pt-32 pb-20 px-4 min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-xl border border-pink-100 p-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Connexion</h2>
          <p className="text-gray-500">Accédez à votre espace FESMODA</p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
          <button 
            onClick={() => setIsEmailLogin(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isEmailLogin ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Email
          </button>
          <button 
            onClick={() => setIsEmailLogin(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isEmailLogin ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Google
          </button>
        </div>

        {isEmailLogin ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Identifiant ou e-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Identifiant ou e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Mot de passe</label>
              <div className="relative">
                <X className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
            </div>
            <button 
              onClick={() => onEmailLogin(email, password)}
              className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 mt-4"
            >
              Se connecter
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={onGoogleLogin}
              className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center space-x-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" />
              <span>Continuer avec Google</span>
            </button>
            <p className="text-center text-sm text-gray-500">
              Connectez-vous rapidement avec votre compte Google.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default function App() {
  useEffect(() => {
    seedDatabase();
    
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'settings', 'global'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Helper to create notifications
  const createNotification = async (userId: string, title: string, message: string, type: 'vote' | 'status' | 'system') => {
    try {
      const newNotif: AppNotification = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            // Ensure admin role for the specific email
            if (isAdminEmail(firebaseUser.email) && profile.role !== 'admin') {
              const updatedProfile = { ...profile, role: 'admin' as const };
              await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile);
              setUser(updatedProfile);
            } else {
              setUser(profile);
            }
          } else {
            // Create default user profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdminEmail(firebaseUser.email) ? 'admin' : 'candidate',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUser(newProfile);
          }
        } catch (error) {
          console.error("Error fetching/creating user profile:", error);
          // Fallback for admin email if doc fetch fails
          if (isAdminEmail(firebaseUser.email)) {
             setUser({
               uid: firebaseUser.uid,
               email: firebaseUser.email || '',
               role: 'admin'
             });
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Candidates Listener
    const unsubscribeCandidates = onSnapshot(query(collection(db, 'candidates'), orderBy('voteCount', 'desc')), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
      setCandidates(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'candidates');
    });

    // Settings Listener
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as Settings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    // Blogs Listener
    const unsubscribeBlogs = onSnapshot(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog));
      setBlogs(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blogs');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeCandidates();
      unsubscribeSettings();
      unsubscribeBlogs();
    };
  }, []);

  // Notifications Listener
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(list);
    }, (error) => {
      // Don't crash if notifications fail, just log
      console.error("Notifications error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    let targetEmail = email.trim().toLowerCase();
    if (targetEmail === 'adminfesmoda') {
      targetEmail = 'adminfesmoda@fesmoda.com';
    }
    const targetPass = pass.trim();
    try {
      await signInWithEmailAndPassword(auth, targetEmail, targetPass);
      setShowLoginModal(false);
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      
      const isDefaultAdmin = (targetEmail === 'adminfesmoda@fesmoda.com' && targetPass === 'Fesmoda1212@') || (targetEmail === 'contact@fesmoda.com' && targetPass === 'Admin1fesmoda');
      
      if (isDefaultAdmin && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        // Attempt to auto-create the default admin if it doesn't exist
        try {
          await createUserWithEmailAndPassword(auth, targetEmail, targetPass);
          setShowLoginModal(false);
          return;
        } catch (createError: any) {
          if (createError.code === 'auth/email-already-in-use') {
            alert("Le compte admin existe déjà mais le mot de passe est incorrect ou la méthode de connexion diffère.");
          } else if (createError.code === 'auth/operation-not-allowed') {
            alert("La création de compte par email n'est pas activée dans votre console Firebase (Authentification > Sign-in method).");
          } else {
            alert(`Erreur lors de la création de l'admin: ${createError.message}`);
          }
          return;
        }
      }

      let errorMessage = `Identifiants incorrects ou erreur de connexion (Code: ${error.code}).`;
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "La connexion par email n'est pas activée dans la console Firebase.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "L'adresse email n'est pas valide.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Ce compte a été désactivé.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Trop de tentatives infructueuses. Veuillez réessayer plus tard.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Les identifiants ne sont pas valides (auth/invalid-credential).";
      }
      
      alert(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (error) {
      console.error("Google login failed", error);
    }
  };

  const handleVoteSuccess = async (candidateId: string, amount: number) => {
    // Find the candidate's user profile to send notification
    const q = query(collection(db, 'users'), where('candidateId', '==', candidateId));
    const userSnapshot = await getDocs(q);
    
    if (!userSnapshot.empty) {
      const candidateUser = userSnapshot.docs[0].data() as UserProfile;
      await createNotification(
        candidateUser.uid,
        "Nouveau Vote !",
        `Vous avez reçu ${amount} nouveau(x) vote(s). Félicitations !`,
        'vote'
      );
    }

    // Also notify admins
    const adminQ = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQ);
    adminSnapshot.forEach(async (adminDoc) => {
      await createNotification(
        adminDoc.id,
        "Nouveau Vote Enregistré",
        `Un vote de ${amount} a été enregistré pour un candidat.`,
        'vote'
      );
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-pink-50">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-white font-sans selection:bg-pink-100 selection:text-pink-600">
          <Navbar user={user} onLogin={handleLogin} notifications={notifications} />
          
          <AnimatePresence>
            {showLoginModal && (
              <LoginModal 
                onClose={() => setShowLoginModal(false)} 
                onEmailLogin={handleEmailLogin}
                onGoogleLogin={handleGoogleLogin}
              />
            )}
          </AnimatePresence>
          
          <main>
            <Routes>
              <Route path="/" element={<Home blogs={blogs} />} />
              <Route path="/login" element={<LoginPage onEmailLogin={handleEmailLogin} onGoogleLogin={handleGoogleLogin} user={user} />} />
              <Route path="/candidates" element={<Candidates candidates={candidates} />} />
              <Route path="/candidate/:id" element={<CandidateProfile candidates={candidates} />} />
              <Route path="/stats" element={<StatsPage candidates={candidates} />} />
              <Route path="/about" element={<div className="pt-32 px-4 max-w-3xl mx-auto"><h1 className="text-4xl font-bold mb-8">Qui sommes-nous?</h1><p className="text-lg text-gray-600 leading-relaxed">FESMODA est un événement annuel dédié à la promotion de la mode et de l'art. Notre mission est de fournir une plateforme aux créateurs émergents pour briller et se connecter avec un public passionné.</p></div>} />
              <Route path="/partners" element={<div className="pt-32 px-4 max-w-3xl mx-auto"><h1 className="text-4xl font-bold mb-8">Devenir Partenaire</h1><p className="text-lg text-gray-600 leading-relaxed">Rejoignez l'aventure FESMODA et associez votre marque à l'excellence créative. Contactez-nous pour découvrir nos opportunités de partenariat.</p></div>} />
              <Route path="/contact" element={<div className="pt-32 px-4 max-w-3xl mx-auto"><h1 className="text-4xl font-bold mb-8">Nous Contacter</h1><p className="text-lg text-gray-600 leading-relaxed">Une question ? Un projet ? Écrivez-nous à contact@fesmoda.com ou utilisez le formulaire ci-dessous.</p></div>} />
              
              {/* Admin & Dashboard routes would go here */}
              <Route path="/admin" element={<AdminDashboard user={user} candidates={candidates} settings={settings} createNotification={createNotification} blogs={blogs} />} />
              <Route path="/dashboard" element={<CandidateDashboard user={user} candidates={candidates} />} />
              <Route path="/profile" element={<ProfileSettings user={user} />} />
              <Route path="/vote/:id" element={<VotePage candidates={candidates} settings={settings} onVoteSuccess={handleVoteSuccess} />} />
            </Routes>
          </main>

          <footer className="bg-gray-900 text-white py-20 mt-20">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-2">
                  <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent inline-block">FESMODA</h2>
                  <p className="text-gray-400 max-w-md leading-relaxed">
                    La plus grande célébration de la mode et de l'art. Notre mission est de propulser les talents émergents sur la scène internationale.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-6 uppercase text-xs tracking-widest text-pink-500">Navigation</h3>
                  <ul className="space-y-4 text-gray-400 text-sm">
                    <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
                    <li><Link to="/candidates" className="hover:text-white transition-colors">Candidats</Link></li>
                    <li><Link to="/about" className="hover:text-white transition-colors">À propos</Link></li>
                    <li><Link to="/partners" className="hover:text-white transition-colors">Partenaires</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-6 uppercase text-xs tracking-widest text-pink-500">Contact</h3>
                  <ul className="space-y-4 text-gray-400 text-sm">
                    <li className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>contact@fesmoda.com</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>+229 01 47 37 93 95</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Info className="w-4 h-4" />
                      <span>Abomey-Calavi, Bénin</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
                <p>© 2026 FESMODA. Tous droits réservés.</p>
                <div className="flex space-x-6">
                  <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                  <a href="#" className="hover:text-white transition-colors">Conditions</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

// --- Additional Components for Dashboards ---

const AdminDashboard = ({ user, candidates, settings, createNotification, blogs }: { 
  user: UserProfile | null, 
  candidates: Candidate[], 
  settings: Settings | null, 
  createNotification: (userId: string, title: string, message: string, type: 'vote' | 'status' | 'system') => Promise<void>,
  blogs: Blog[]
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'candidates' | 'blogs'>('general');
  const [merchantId, setMerchantId] = useState(settings?.moneyFusionMerchantId || '');
  const [apiKey, setApiKey] = useState(settings?.moneyFusionApiKey || '');
  const [votePrice, setVotePrice] = useState(settings?.votePrice || 100);
  const [isSaving, setIsSaving] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);

  // Candidate form state
  const [candName, setCandName] = useState('');
  const [candCategory, setCandCategory] = useState<'Fashion' | 'Art' | 'Design'>('Fashion');
  const [candEmail, setCandEmail] = useState('');
  const [candPhoto, setCandPhoto] = useState('');
  const [candVoteGoal, setCandVoteGoal] = useState<number>(2000);

  // Candidate editing state
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'Fashion' | 'Art' | 'Design'>('Fashion');
  const [editEmail, setEditEmail] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editVoteGoal, setEditVoteGoal] = useState<number>(2000);
  const [editIsVotingActive, setEditIsVotingActive] = useState<boolean>(true);

  // Blog publishing form state
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('');

  const handleCandidatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("L'image est trop grande (max 800KB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCandPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditCandidatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("L'image est trop grande (max 800KB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlogImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) {
        alert("L'image est trop grande (max 1MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (settings) {
      setMerchantId(settings.moneyFusionMerchantId);
      setApiKey(settings.moneyFusionApiKey);
      setVotePrice(settings.votePrice);
    }
  }, [settings]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    // Real-time votes listener
    const unsubscribeVotes = onSnapshot(
      query(collection(db, 'votes'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vote));
        setVotes(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'votes');
      }
    );

    return () => unsubscribeVotes();
  }, [user]);

  if (user?.role !== 'admin') return <div className="pt-32 text-center">Accès refusé</div>;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        moneyFusionMerchantId: merchantId,
        moneyFusionApiKey: apiKey,
        votePrice: Number(votePrice),
        isVotingEnabled: true
      }, { merge: true });
      alert('Configuration sauvegardée !');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const candidatesRef = collection(db, 'candidates');
      const newCandidateRef = doc(candidatesRef);
      const newCandidateId = newCandidateRef.id;

      await setDoc(newCandidateRef, {
        name: candName,
        category: candCategory,
        email: candEmail,
        photoUrl: candPhoto || `https://picsum.photos/seed/${Date.now()}/600/800`,
        bio: 'Nouveau candidat FESMODA.',
        voteCount: 0,
        isEligible: false,
        status: 'pending',
        voteGoal: Number(candVoteGoal),
        isVotingActive: true,
        createdAt: new Date().toISOString()
      });

      // Automatically assign the new candidate's ID to the 'candidateId' field of the 'users' document
      if (user?.uid && user.role === 'admin') {
        await setDoc(doc(db, 'users', user.uid), { 
          candidateId: newCandidateId 
        }, { merge: true });
      }

      setCandName('');
      setCandEmail('');
      setCandPhoto('');
      setCandVoteGoal(2000);
      alert('Candidat ajouté avec succès !');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'candidates');
    }
  };

  const handleUpdateStatus = async (candidateId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'candidates', candidateId), { status: newStatus });
      
      // Find candidate user to notify
      const q = query(collection(db, 'users'), where('candidateId', '==', candidateId));
      const userSnapshot = await getDocs(q);
      if (!userSnapshot.empty) {
        const candidateUser = userSnapshot.docs[0].data() as UserProfile;
        await createNotification(
          candidateUser.uid,
          "Statut Mis à Jour",
          `Votre statut a été changé en : ${newStatus.toUpperCase()}`,
          'status'
        );
      }
      alert('Statut mis à jour !');
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEditClick = (c: Candidate) => {
    setEditingCandidate(c);
    setEditName(c.name);
    setEditCategory(c.category);
    setEditEmail(c.email);
    setEditPhotoUrl(c.photoUrl);
    setEditBio(c.bio || '');
    setEditVoteGoal(c.voteGoal || 2000);
    setEditIsVotingActive(c.isVotingActive !== false);
  };

  const handleSaveEditedCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      await updateDoc(doc(db, 'candidates', editingCandidate.id), {
        name: editName,
        category: editCategory,
        email: editEmail,
        photoUrl: editPhotoUrl,
        bio: editBio,
        voteGoal: Number(editVoteGoal),
        isVotingActive: editIsVotingActive,
        isEligible: editingCandidate.voteCount >= Number(editVoteGoal)
      });
      alert('Candidat mis à jour avec succès !');
      setEditingCandidate(null);
    } catch (error) {
      console.error("Error updating candidate:", error);
      alert('Erreur lors de la modification.');
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce candidat ?")) return;
    try {
      await deleteDoc(doc(db, 'candidates', candidateId));
      alert('Candidat supprimé !');
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  const handleAddBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const blogId = Math.random().toString(36).substr(2, 9);
      const newBlog: Blog = {
        id: blogId,
        title: blogTitle,
        content: blogContent,
        image: blogImage || `https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80`,
        author: blogAuthor || 'FESMODA Officiel',
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'blogs', blogId), newBlog);
      setBlogTitle('');
      setBlogContent('');
      setBlogImage('');
      setBlogAuthor('');
      alert('Actualité publiée avec succès !');
    } catch (error) {
      console.error("Error writing blog post:", error);
      alert('Erreur lors de la publication.');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Voulez-vous supprimer cette publication ?')) return;
    try {
      await deleteDoc(doc(db, 'blogs', id));
      alert('Publication supprimée !');
    } catch (error) {
      console.error("Error deleting blog post:", error);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Gérez l'événement, les candidats, les actualités et les paiements.</p>
        </div>
        <button onClick={() => signOut(auth)} className="flex items-center space-x-2 text-red-500 font-bold hover:opacity-80 transition-opacity">
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-pink-100 pb-px mb-10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all rounded-t-2xl flex items-center space-x-2 border-b-2",
            activeTab === 'general' 
              ? "bg-pink-50 text-pink-600 border-pink-600" 
              : "text-gray-500 border-transparent hover:text-gray-900"
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>Général & Paiements</span>
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all rounded-t-2xl flex items-center space-x-2 border-b-2",
            activeTab === 'candidates' 
              ? "bg-pink-50 text-pink-600 border-pink-600" 
              : "text-gray-500 border-transparent hover:text-gray-900"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Gestion des Candidats</span>
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all rounded-t-2xl flex items-center space-x-2 border-b-2",
            activeTab === 'blogs' 
              ? "bg-pink-50 text-pink-600 border-pink-600" 
              : "text-gray-500 border-transparent hover:text-gray-900"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Publications & Actualités</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'general' && (
        <div className="space-y-12">
          {/* Main stats counters */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Candidats</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{candidates.length}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Votes</p>
              <p className="text-4xl font-black text-pink-600 mt-2">{candidates.reduce((acc, curr) => acc + curr.voteCount, 0)}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Revenus Est.</p>
              <p className="text-4xl font-black text-green-600 mt-2">{(candidates.reduce((acc, curr) => acc + curr.voteCount, 0) * (settings?.votePrice || 0)).toLocaleString()} FCFA</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Money Fusion Config */}
            <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm h-fit">
              <div className="flex items-center space-x-3 mb-6">
                <CreditCard className="w-6 h-6 text-pink-600" />
                <h2 className="text-xl font-bold">Configuration Money Fusion</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
                  <input 
                    type="text" 
                    value={merchantId} 
                    onChange={(e) => setMerchantId(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix du Vote (FCFA)</label>
                  <input 
                    type="number" 
                    value={votePrice} 
                    onChange={(e) => setVotePrice(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                  />
                </div>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
                </button>
              </div>
            </div>

            {/* Live Vote Feed */}
            <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="w-6 h-6 text-pink-600" />
                <h2 className="text-xl font-bold">Flux de Votes en Direct</h2>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {votes.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 italic">Aucun vote enregistré</div>
                ) : (
                  votes.map((v) => {
                    const cand = candidates.find(c => c.id === v.candidateId);
                    return (
                      <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                            {v.voterEmail[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{v.voterEmail}</p>
                            <p className="text-xs text-gray-500">A voté pour <span className="text-pink-600 font-bold">{cand?.name || 'Candidat inconnu'}</span></p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {v.transactionId}</span>
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                v.paymentStatus === 'completed' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                              )}>
                                {v.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-pink-600">+{v.amount} Votes</p>
                          <p className="text-[10px] text-gray-400">{new Date(v.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="space-y-12">
          {editingCandidate ? (
            /* Program & Edit Candidate Form */
            <div className="p-8 bg-pink-50 border border-pink-100 rounded-3xl max-w-3xl mx-auto shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <EditIcon className="w-6 h-6 text-pink-600" />
                  <h2 className="text-xl font-bold text-gray-900">Programmer & Modifier le Candidat</h2>
                </div>
                <button 
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-full uppercase tracking-wider transition-all"
                >
                  Annuler
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSaveEditedCandidate}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as any)}
                      className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    >
                      <option value="Fashion">Fashion</option>
                      <option value="Art">Art</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email de Connexion</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectif de Votes (Seuil d'éligibilité)</label>
                    <input 
                      type="number" 
                      value={editVoteGoal}
                      onChange={(e) => setEditVoteGoal(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo du Candidat</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0 flex items-center justify-center">
                      {editPhotoUrl ? (
                        <img src={editPhotoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Users className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleEditCandidatePhotoUpload}
                          className="hidden"
                          id="edit-cand-photo-upload"
                        />
                        <label 
                          htmlFor="edit-cand-photo-upload"
                          className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          Téléverser une Photo (Max 800KB)
                        </label>
                      </div>
                      <p className="text-xs text-gray-400">Ou entrez une URL d'image ci-dessous :</p>
                      <input 
                        type="url" 
                        value={editPhotoUrl}
                        onChange={(e) => setEditPhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Biographie</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                    placeholder="Présentez le candidat en quelques phrases inspirantes..."
                  />
                </div>

                <div className="p-4 bg-white border border-pink-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Activer la possibilité de voter</p>
                    <p className="text-xs text-gray-400">Si désactivé, le public verra un message d'attente et ne pourra pas voter.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsVotingActive(!editIsVotingActive)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                      editIsVotingActive 
                        ? "bg-green-100 text-green-600 hover:bg-green-200" 
                        : "bg-red-100 text-red-600 hover:bg-red-200"
                    )}
                  >
                    {editIsVotingActive ? "Votes Ouverts" : "Votes Suspendus"}
                  </button>
                </div>

                <button type="submit" className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-md">
                  Sauvegarder les modifications du Candidat
                </button>
              </form>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Add Candidate Form */}
              <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm h-fit lg:col-span-1">
                <div className="flex items-center space-x-3 mb-6">
                  <Plus className="w-6 h-6 text-pink-600" />
                  <h2 className="text-xl font-bold">Créer un Candidat</h2>
                </div>
                <form className="space-y-4" onSubmit={handleAddCandidate}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                    <input 
                      type="text" 
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                      placeholder="Ex: David Mensah"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select 
                      value={candCategory}
                      onChange={(e) => setCandCategory(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    >
                      <option value="Fashion">Fashion</option>
                      <option value="Art">Art</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Objectif de Votes (Goal)</label>
                    <input 
                      type="number" 
                      value={candVoteGoal}
                      onChange={(e) => setCandVoteGoal(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                      placeholder="Ex: david@fesmoda.com"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo du Candidat</label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                        {candPhoto ? (
                          <img src={candPhoto} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleCandidatePhotoUpload}
                            className="hidden"
                            id="cand-photo-upload"
                          />
                          <label 
                            htmlFor="cand-photo-upload"
                            className="px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-pink-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                          >
                            Téléverser (Max 800KB)
                          </label>
                        </div>
                        <input 
                          type="url" 
                          value={candPhoto}
                          onChange={(e) => setCandPhoto(e.target.value)}
                          placeholder="Ou URL d'image"
                          className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-sm">
                    Ajouter le candidat
                  </button>
                </form>
              </div>

              {/* Table list */}
              <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm lg:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <Users className="w-6 h-6 text-pink-600" />
                  <h2 className="text-xl font-bold">Tableau de bord de tous les candidats</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-pink-50">
                        <th className="text-left py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Candidat</th>
                        <th className="text-left py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Votes / Goal</th>
                        <th className="text-left py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="text-left py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Validation</th>
                        <th className="text-right py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50">
                      {candidates.map((c) => {
                        const goal = c.voteGoal || 2000;
                        const isVotingClosed = c.isVotingActive === false;
                        return (
                          <tr key={c.id} className="hover:bg-pink-50/30 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center space-x-3">
                                <img src={c.photoUrl} className="w-10 h-10 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                                <div>
                                  <p className="font-bold text-gray-900">{c.name}</p>
                                  <p className="text-xs text-pink-600 font-bold uppercase tracking-wider">{c.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="font-black text-pink-600 block">{c.voteCount}</span>
                              <span className="text-[10px] text-gray-400">Objectif: {goal}</span>
                            </td>
                            <td className="py-4">
                              <span className={cn(
                                "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider",
                                isVotingClosed ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                              )}>
                                {isVotingClosed ? "Suspendu" : "Actif"}
                              </span>
                            </td>
                            <td className="py-4">
                              <select 
                                value={c.status || 'pending'}
                                onChange={(e) => handleUpdateStatus(c.id, e.target.value)}
                                className="text-xs font-bold px-2 py-1 rounded-lg border border-pink-100 bg-white outline-none focus:ring-1 focus:ring-pink-500"
                              >
                                <option value="pending">En attente</option>
                                <option value="active">Actif</option>
                                <option value="elite">Elite</option>
                                <option value="disqualified">Disqualifié</option>
                              </select>
                            </td>
                            <td className="py-4 text-right space-x-2">
                              <button 
                                onClick={() => handleEditClick(c)}
                                className="p-2 text-gray-400 hover:text-pink-600 transition-colors inline-block"
                                title="Modifier / Programmer"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCandidate(c.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-block"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'blogs' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Blog Form */}
          <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm h-fit lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <Plus className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-bold">Publier un Actualité / Blog</h2>
            </div>
            <form className="space-y-4" onSubmit={handleAddBlog}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'Actualité</label>
                <input 
                  type="text" 
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                  placeholder="Ex: Grand défilé FESMODA 2026 à Cotonou"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auteur</label>
                <input 
                  type="text" 
                  value={blogAuthor}
                  onChange={(e) => setBlogAuthor(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none" 
                  placeholder="Ex: Comité d'Organisation"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image de l'Actualité / Publication</label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                    {blogImage ? (
                      <img src={blogImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleBlogImageUpload}
                        className="hidden"
                        id="blog-image-upload"
                      />
                      <label 
                        htmlFor="blog-image-upload"
                        className="px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-pink-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        Téléverser (Max 1MB)
                      </label>
                    </div>
                    <input 
                      type="url" 
                      value={blogImage}
                      onChange={(e) => setBlogImage(e.target.value)}
                      placeholder="Ou URL d'image"
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu de la Publication</label>
                <textarea 
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none resize-none" 
                  placeholder="Écrivez votre article d'actualité ici..."
                  required 
                />
              </div>
              <button type="submit" className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-sm">
                Publier l'actualité
              </button>
            </form>
          </div>

          {/* Published Articles List */}
          <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <BookOpen className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-bold">Articles et actualités publiés</h2>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {blogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 italic">Aucune actualité publiée. Utilisez le formulaire pour commencer.</div>
              ) : (
                blogs.map((b) => (
                  <div key={b.id} className="flex items-start justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
                    <div className="flex space-x-4">
                      <img 
                        src={b.image} 
                        alt={b.title} 
                        className="w-20 h-20 rounded-xl object-cover border border-gray-200" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1">
                        <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">{b.date}</span>
                        <h4 className="font-bold text-gray-900 line-clamp-1">{b.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{b.content}</p>
                        <p className="text-[10px] text-gray-400">Par: <span className="font-medium text-gray-600">{b.author}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteBlog(b.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Supprimer la publication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileSettings = ({ user }: { user: UserProfile | null }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return <div className="pt-32 text-center">Veuillez vous connecter.</div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for base64 in Firestore
        alert("L'image est trop grande (max 500KB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        bio
      });

      // If candidate, also update candidate document
      if (user.candidateId) {
        const candidateRef = doc(db, 'candidates', user.candidateId);
        await updateDoc(candidateRef, {
          name: displayName,
          photoUrl: photoURL,
          bio
        });
      }
      alert('Profil mis à jour avec succès !');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-pink-100 p-10 shadow-2xl shadow-pink-100"
      >
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-10 h-10 text-pink-600" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Paramètres du Profil</h1>
            <p className="text-gray-500">Gérez vos informations personnelles.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Nom d'affichage</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-pink-50 bg-pink-50/30 focus:ring-2 focus:ring-pink-500 outline-none transition-all font-medium"
              placeholder="Votre nom complet"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Photo de Profil</label>
            <div className="flex items-center space-x-4">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profile-pic-upload"
              />
              <label 
                htmlFor="profile-pic-upload"
                className="px-6 py-3 bg-white border border-pink-100 rounded-xl text-pink-600 font-bold text-sm cursor-pointer hover:bg-pink-50 transition-colors"
              >
                Choisir une image
              </label>
              <input 
                type="url" 
                value={photoURL.startsWith('data:') ? 'Image chargée' : photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="flex-1 px-6 py-3 rounded-xl border border-pink-50 bg-pink-50/30 focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm"
                placeholder="Ou collez une URL..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Bio (Courte description)</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-6 py-4 rounded-2xl border border-pink-50 bg-pink-50/30 focus:ring-2 focus:ring-pink-500 outline-none transition-all font-medium resize-none"
              placeholder="Parlez-nous de vous..."
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full py-5 bg-pink-600 text-white rounded-2xl font-black text-lg hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const CandidateDashboard = ({ user, candidates }: { user: UserProfile | null, candidates: Candidate[] }) => {
  const candidate = candidates.find(c => c.id === user?.candidateId);
  const goal = 2000;
  
  if (!candidate) return <div className="pt-32 text-center">Aucun profil candidat lié.</div>;

  const progress = Math.min(100, (candidate.voteCount / goal) * 100);

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Mon Profil Candidat</h1>
          <p className="text-gray-500 mt-2">Suivez vos performances en temps réel.</p>
        </div>
        <button onClick={() => signOut(auth)} className="flex items-center space-x-2 text-red-500 font-medium hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-sm sticky top-32">
            <img src={candidate.photoUrl} className="w-full aspect-square object-cover" referrerPolicy="no-referrer" />
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
              <p className="text-pink-600 font-medium">{candidate.category}</p>
              
              <div className="flex items-center justify-center space-x-2 mt-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  candidate.voteCount >= goal ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                )}>
                  {candidate.voteCount >= goal ? 'Éligible' : 'En Progression'}
                </span>
                {candidate.status && candidate.status !== 'pending' && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    candidate.status === 'elite' ? "bg-purple-100 text-purple-600" : 
                    candidate.status === 'disqualified' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {candidate.status}
                  </span>
                )}
              </div>

              <div className="mt-6 p-4 bg-pink-50 rounded-2xl">
                <p className="text-sm text-pink-600 font-medium uppercase tracking-wider">Votre Score Actuel</p>
                <p className="text-5xl font-black text-pink-600 mt-1">{candidate.voteCount}</p>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-2 text-gray-500 text-sm">
                <Mail className="w-4 h-4" />
                <span>{candidate.email}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
           {/* Progress to PRIX d'OR */}
           <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Trophy className="w-32 h-32 text-pink-600" />
              </div>
              <div className="flex items-center space-x-3 mb-6">
                <Award className="w-6 h-6 text-pink-600" />
                <h3 className="text-xl font-bold">Objectif : PRIX d'OR FESMODA</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-black text-gray-900">{candidate.voteCount} <span className="text-lg font-normal text-gray-400">/ {goal} votes</span></p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        candidate.voteCount >= goal ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                      )} />
                      <p className="text-sm text-gray-500">
                        {candidate.voteCount >= goal ? 'Éligible pour le PRIX d\'OR' : `Plus que ${Math.max(0, goal - candidate.voteCount)} votes pour l'éligibilité.`}
                      </p>
                    </div>
                  </div>
                  <p className="text-pink-600 font-bold text-xl">{Math.round(progress)}%</p>
                </div>
                
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Statut</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {candidate.voteCount >= goal ? 'Éligible' : 'En progression'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Niveau</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {candidate.voteCount >= goal ? 'Elite' : 'Candidat'}
                    </p>
                  </div>
                </div>
              </div>
           </div>

           <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="w-6 h-6 text-pink-600" />
                <h3 className="text-xl font-bold">Statistiques Détaillées</h3>
              </div>
              <div className="h-[200px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <p className="font-medium">Analyse des votes</p>
                  <p className="text-xs mt-1">Les graphiques détaillés seront disponibles prochainement.</p>
                </div>
              </div>
           </div>

           <div className="p-8 bg-white rounded-3xl border border-pink-100 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Biographie & Présentation</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{candidate.bio}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const CandidateProfile = ({ candidates }: { candidates: Candidate[] }) => {
  const { id } = useLocation().pathname.split('/').pop() ? { id: useLocation().pathname.split('/').pop() } : { id: '' };
  const candidate = candidates.find(c => c.id === id);

  if (!candidate) return <div className="pt-32 text-center">Candidat non trouvé</div>;

  const progress = Math.min(100, (candidate.voteCount / VOTE_GOAL) * 100);

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white"
        >
          <img src={candidate.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <span className="px-4 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-black uppercase tracking-widest">
                {candidate.category}
              </span>
              {candidate.isEligible && (
                <span className="flex items-center space-x-1 px-4 py-1 bg-green-100 text-green-600 rounded-full text-xs font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Éligible</span>
                </span>
              )}
            </div>
            <h1 className="text-5xl font-black text-gray-900 leading-tight">{candidate.name}</h1>
          </div>

          <div className="p-8 bg-pink-50 rounded-[2rem] border border-pink-100">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-sm font-bold text-pink-600 uppercase tracking-widest mb-1">Progression Éligibilité</p>
                <p className="text-3xl font-black text-gray-900">{candidate.voteCount} <span className="text-lg font-normal text-gray-400">/ {VOTE_GOAL} votes</span></p>
              </div>
              <p className="text-2xl font-black text-pink-600">{Math.round(progress)}%</p>
            </div>
            <div className="h-3 w-full bg-white rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-pink-600"
              />
            </div>
            {candidate.isEligible ? (
              <p className="mt-4 text-sm text-green-600 font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Objectif atteint ! Ce candidat est éligible pour le PRIX d'OR.
              </p>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Plus que {VOTE_GOAL - candidate.voteCount} votes pour atteindre l'éligibilité.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">À propos</h3>
            <p className="text-gray-600 leading-relaxed text-lg italic">"{candidate.bio}"</p>
          </div>

          <div className="pt-6">
            <Link 
              to={`/vote/${candidate.id}`}
              className="inline-flex items-center justify-center px-10 py-5 bg-pink-600 text-white rounded-2xl font-bold text-xl hover:bg-pink-700 transition-all shadow-xl shadow-pink-200 group"
            >
              Voter maintenant
              <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const VotePage = ({ candidates, settings, onVoteSuccess }: { candidates: Candidate[], settings: Settings | null, onVoteSuccess: (candidateId: string, amount: number) => void }) => {
  const { id } = useLocation().pathname.split('/').pop() ? { id: useLocation().pathname.split('/').pop() } : { id: '' };
  const candidate = candidates.find(c => c.id === id);
  const [step, setStep] = useState(1);
  const [voteAmount, setVoteAmount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!candidate) return <div className="pt-32 text-center">Candidat non trouvé</div>;

  const pricePerVote = settings?.votePrice || 100;
  const totalPrice = voteAmount * pricePerVote;

  const handleCompleteVote = async () => {
    setIsProcessing(true);
    try {
      // 1. Create Vote record
      const voteId = Math.random().toString(36).substr(2, 9);
      const newVote: Vote = {
        id: voteId,
        candidateId: candidate.id,
        voterEmail: "visiteur@fesmoda.com", // Simulated
        amount: voteAmount,
        paymentStatus: 'completed',
        transactionId: `MF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'votes', voteId), newVote);

      // 2. Update Candidate vote count
      const candidateRef = doc(db, 'candidates', candidate.id);
      const candidateSnap = await getDoc(candidateRef);
      const currentVotes = candidateSnap.exists() ? (candidateSnap.data() as Candidate).voteCount : 0;
      const newTotal = currentVotes + voteAmount;
      
      await updateDoc(candidateRef, {
        voteCount: increment(voteAmount),
        isEligible: newTotal >= VOTE_GOAL
      });

      // 3. Trigger callback for notification
      onVoteSuccess(candidate.id, voteAmount);

      setStep(3); // Success step
    } catch (error) {
      console.error("Vote failed:", error);
      alert("Erreur lors de la validation du vote.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl border border-pink-100 p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-pink-100 mb-4">
            <img src={candidate.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Voter pour {candidate.name}</h2>
          {candidate.isEligible && (
            <div className="mt-2 flex items-center justify-center space-x-2 text-green-600 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Candidat Éligible (Objectif Atteint)</span>
            </div>
          )}
          <p className="text-gray-500 mt-2">Soutenez votre candidat préféré en un clic.</p>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nombre de votes</label>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setVoteAmount(Math.max(1, voteAmount - 1))}
                  className="w-12 h-12 rounded-xl border border-pink-200 flex items-center justify-center text-pink-600 font-bold hover:bg-pink-50"
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="1"
                  value={voteAmount}
                  onChange={(e) => setVoteAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 h-12 text-center rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg"
                />
                <button 
                  onClick={() => setVoteAmount(voteAmount + 1)}
                  className="w-12 h-12 rounded-xl border border-pink-200 flex items-center justify-center text-pink-600 font-bold hover:bg-pink-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-6 bg-pink-50 rounded-2xl text-center">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-pink-600 font-medium uppercase">Prix par vote</span>
                <span className="font-bold text-pink-600">{pricePerVote} FCFA</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-pink-200">
                <span className="text-sm text-pink-600 font-bold uppercase">Total à payer</span>
                <span className="text-3xl font-black text-pink-600">{totalPrice} FCFA</span>
              </div>
            </div>
            
            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
            >
              Procéder au Paiement
            </button>
          </div>
        ) : step === 2 ? (
          <div className="space-y-6">
            <div className="p-6 border-2 border-dashed border-pink-200 rounded-2xl text-center">
              <p className="text-gray-600 mb-4">Simulation du paiement Money Fusion...</p>
              <div className="flex justify-center space-x-2 mb-6">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-pink-600 rounded-full" />
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-pink-600 rounded-full" />
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-pink-600 rounded-full" />
              </div>
              <button 
                onClick={handleCompleteVote}
                disabled={isProcessing}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
              >
                {isProcessing ? 'Validation...' : 'Confirmer le Paiement (Simulé)'}
              </button>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="w-full py-3 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Vote Confirmé !</h3>
            <p className="text-gray-600 mb-8">Merci pour votre soutien. Votre vote a été pris en compte avec succès.</p>
            <Link to="/candidates" className="inline-block px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors">
              Retour aux candidats
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const StatsPage = ({ candidates }: { candidates: Candidate[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

  const filteredCandidates = candidates
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => b.voteCount - a.voteCount);

  // Overall leader podium
  const sortedOverall = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const podium = sortedOverall.slice(0, 3);

  // Category statistics
  const categories = ['Fashion', 'Art', 'Design'];
  const getCategoryLeader = (cat: string) => {
    const list = candidates.filter(c => c.category === cat);
    if (list.length === 0) return null;
    return list.reduce((prev, curr) => (curr.voteCount > prev.voteCount ? curr : prev));
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto min-h-screen bg-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center space-x-2 bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-pink-600"></span>
            <span>Mise à jour en direct</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Statistiques en Temps Réel
          </h1>
          <p className="text-gray-500 mt-2">Suivez la progression des votes de tous les candidats de FESMODA.</p>
        </div>
        
        {/* Total Votes Card */}
        <div className="p-6 bg-pink-50/50 border border-pink-100 rounded-3xl flex items-center space-x-4">
          <div className="p-4 bg-pink-600 text-white rounded-2xl">
            <VoteIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Votes Enregistrés</p>
            <p className="text-3xl font-black text-gray-900">{totalVotes.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Podium Block (Top 3 Candidates) */}
      {candidates.length >= 1 && (
        <div className="mb-20">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider mb-8 text-center flex items-center justify-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Le Podium Provisoire</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-10">
            {/* 2nd Place */}
            {podium[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center order-2 md:order-1"
              >
                <div className="relative mb-4 group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-300 shadow-lg relative z-10">
                    <img src={podium[1].photoUrl} alt={podium[1].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-slate-300 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white z-20 text-xs">
                    2
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{podium[1].name}</h3>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{podium[1].category}</span>
                <div className="w-full bg-slate-100 border border-slate-200 p-4 rounded-t-3xl text-center mt-4 min-h-[120px] flex flex-col justify-center">
                  <p className="text-2xl font-black text-slate-700">{podium[1].voteCount}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Votes</p>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {podium[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center order-1 md:order-2"
              >
                <div className="relative mb-4">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                    <Trophy className="w-10 h-10 drop-shadow-md" />
                  </div>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl relative z-10">
                    <img src={podium[0].photoUrl} alt={podium[0].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white z-20 text-sm">
                    1
                  </div>
                </div>
                <h3 className="font-black text-gray-900 text-xl">{podium[0].name}</h3>
                <span className="text-xs text-pink-600 font-bold uppercase tracking-wider">{podium[0].category}</span>
                <div className="w-full bg-yellow-50 border border-yellow-200 p-6 rounded-t-3xl text-center mt-4 min-h-[150px] flex flex-col justify-center shadow-lg shadow-yellow-100">
                  <p className="text-3xl font-black text-yellow-600">{podium[0].voteCount}</p>
                  <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">Votes</p>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {podium[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center order-3"
              >
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-600/50 shadow-lg relative z-10">
                    <img src={podium[2].photoUrl} alt={podium[2].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white z-20 text-xs">
                    3
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{podium[2].name}</h3>
                <span className="text-xs text-amber-600/70 font-bold uppercase tracking-wider">{podium[2].category}</span>
                <div className="w-full bg-amber-50/50 border border-amber-100 p-4 rounded-t-3xl text-center mt-4 min-h-[100px] flex flex-col justify-center">
                  <p className="text-2xl font-black text-amber-700">{podium[2].voteCount}</p>
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Votes</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Category Leaders */}
      <div className="mb-20">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider mb-8">
          Leaders par Catégorie
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((cat) => {
            const leader = getCategoryLeader(cat);
            return (
              <div key={cat} className="p-8 bg-white border border-pink-50 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full flex items-center justify-center pr-3 pb-3">
                  <Award className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-xs font-bold text-pink-600 uppercase tracking-widest mb-6">{cat}</p>
                
                {leader ? (
                  <div className="flex items-center space-x-4">
                    <img src={leader.photoUrl} alt={leader.name} className="w-16 h-16 rounded-full object-cover border-2 border-pink-100" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{leader.name}</p>
                      <p className="text-xs text-gray-500 font-medium">En tête avec <span className="font-bold text-pink-600">{leader.voteCount}</span> votes</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">Aucun candidat dans cette catégorie</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Statistics Ranking list */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">
            Classement Général
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                selectedCategory === 'all' ? "bg-pink-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  selectedCategory === cat ? "bg-pink-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search & Progress lists */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Rechercher un candidat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-pink-50 bg-pink-50/10 focus:ring-2 focus:ring-pink-500 outline-none font-medium transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-20 text-gray-400 italic bg-pink-50/10 border border-pink-50 rounded-3xl">
              Aucun candidat trouvé pour cette sélection.
            </div>
          ) : (
            filteredCandidates.map((c, i) => {
              const votePercentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
              const progressPercentage = Math.min(100, (c.voteCount / (c.voteGoal || 2000)) * 100).toFixed(0);
              
              return (
                <div key={c.id} className="p-6 bg-white border border-pink-50 rounded-3xl hover:border-pink-200 transition-colors shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-black text-gray-300 w-8 text-center">
                        #{i + 1}
                      </div>
                      <img src={c.photoUrl} alt={c.name} className="w-14 h-14 rounded-full object-cover border border-pink-100" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
                          <span>{c.name}</span>
                          {c.voteCount >= (c.voteGoal || 2000) && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </h4>
                        <span className="text-xs text-pink-600 font-bold uppercase tracking-wider">{c.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-8 md:text-right">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Votes</p>
                        <p className="text-2xl font-black text-pink-600">{c.voteCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Part des Votes</p>
                        <p className="text-2xl font-black text-gray-900">{votePercentage}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Objectif éligibilité ({progressPercentage}%)</span>
                      <span className="font-bold text-gray-700">{c.voteCount} / {c.voteGoal || 2000} votes</span>
                    </div>
                    <div className="w-full h-3 bg-pink-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
