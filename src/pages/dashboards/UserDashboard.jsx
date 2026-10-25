import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import CountUp from "react-countup";
import { pageVariants, pageTransition } from "../../constants/motionVariants";
import { useAuth } from "../../hooks/useAuth";
import databaseService from "../../services/databaseService";
import ErrorBoundary from "../../components/ErrorBoundary";
import { UserDashboardOverviewSkeleton } from "../../components/SkeletonLoader";
import { stripHtml, updatePageSEO } from "../../utils";
import SecurityPanel from "../../components/SecurityPanel";
import IssuedCertificates from "../../components/IssuedCertificates";

import {
  Dialog,
  DialogContent,
  Button,
  Grid,
  Divider,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import LockIcon from "@mui/icons-material/Lock";
import VerifiedIcon from "@mui/icons-material/Verified";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import ArticleIcon from "@mui/icons-material/Article";

// ─── Status Icon Helper ──────────────────────────────────────────────────────
const StatusIcon = ({ status, size = 18 }) => {
  if (status === "SUCCESS")
    return <CheckCircleIcon sx={{ fontSize: size, color: "#10b981" }} />;
  if (status === "FAILED")
    return <CancelIcon sx={{ fontSize: size, color: "#ef4444" }} />;
  if (status === "REFUNDED")
    return <ReceiptLongIcon sx={{ fontSize: size, color: "#8b5cf6" }} />;
  return <PendingIcon sx={{ fontSize: size, color: "#f59e0b" }} />;
};

// ─── Masked PAN display ──────────────────────────────────────────────────────
const MaskedPan = ({ pan, masked }) => {
  const display = masked || (pan ? "xxxxxxx" + pan.slice(-4) : null);
  if (!display) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 font-mono text-[11px] text-slate-700 font-bold tracking-widest">
      <LockIcon sx={{ fontSize: 11, color: "#64748b" }} />
      {display}
    </span>
  );
};

// ─── Safe Date display ────────────────────────────────────────────────────────
const safeFormatDate = (dateStr, options = { day: "numeric", month: "short", year: "numeric" }) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", options);
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [recommendedStories, setRecommendedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Printable Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Per-row PDF download loading state
  const [downloadingId, setDownloadingId] = useState(null);

  // Previous achievements list for detecting new unlocks
  const prevAchievementsRef = useRef([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  useEffect(() => {
    updatePageSEO("Donor Dashboard", "", "", true);
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [donationsData, storiesData] = await Promise.all([
          databaseService.getMyDonations(),
          databaseService.getSuccessStories(),
        ]);
        if (isMounted) {
          setDonations(donationsData?.data || donationsData || []);
          const publishedStories = (storiesData || []).filter(
            (s) => s.published !== false
          );
          setRecommendedStories(publishedStories.slice(0, 2));
        }
      } catch (err) {
        console.error("[UserDashboard] Error fetching dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter successful donations
  const successfulDonations = donations.filter((d) => d.status === "SUCCESS");

  // Sum of successful donations
  const totalDonated = successfulDonations.reduce(
    (sum, d) => sum + Number(d.amount || 0),
    0
  );

  // Number of initiatives supported (unique event/campaign associations)
  const uniqueInitiatives = new Set(
    successfulDonations.map((d) => d.eventTitle || d.eventId || "General Fund")
  ).size;

  // Computed impact stats
  const livesImpacted = Math.round(totalDonated / 500);
  const mealsEnabled = Math.round(totalDonated / 100);

  // Donor Tier Calculator
  const getDonorTier = (amount) => {
    if (amount >= 100000)
      return {
        name: "Patron of Hope",
        next: "Max Tier Achieved",
        progress: 100,
        border: "border-yellow-400 text-yellow-500",
        bg: "from-yellow-600/20 via-amber-500/10 to-transparent",
        badge: "👑",
      };
    if (amount >= 25000)
      return {
        name: "Community Champion",
        next: "Patron of Hope (₹1,00,000)",
        progress: Math.min((amount / 100000) * 100, 100),
        border: "border-amber-400 text-amber-500",
        bg: "from-amber-600/20 via-yellow-500/10 to-transparent",
        badge: "⭐️",
      };
    if (amount >= 5000)
      return {
        name: "Sustaining Supporter",
        next: "Community Champion (₹25,000)",
        progress: Math.min((amount / 25000) * 100, 100),
        border: "border-blue-400 text-blue-500",
        bg: "from-blue-600/20 via-indigo-500/10 to-transparent",
        badge: "🛡️",
      };
    return {
      name: "Valued Donor",
      next: "Sustaining Supporter (₹5,000)",
      progress: Math.min((amount / 5000) * 100, 100),
      border: "border-slate-400 text-slate-500",
      bg: "from-slate-600/20 via-slate-500/10 to-transparent",
      badge: "❤️",
    };
  };

  const tier = getDonorTier(totalDonated);

  // Format currency to Rupee
  const formatRupee = (value) => {
    const val = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(isNaN(val) ? 0 : val);
  };

  // Filter and search donations
  const filteredDonations = donations.filter((d) => {
    const matchesStatus = filterStatus === "ALL" || d.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      (d.receiptNumber &&
        d.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.eventTitle &&
        d.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Monthly trend data
  const getMonthlyTrendData = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      monthlyData[mName] = 0;
    }
    successfulDonations.forEach((don) => {
      if (don.createdAt) {
        const date = new Date(don.createdAt);
        if (!isNaN(date.getTime())) {
          const mName = months[date.getMonth()];
          if (monthlyData[mName] !== undefined) {
            monthlyData[mName] += Number(don.amount || 0);
          }
        }
      }
    });
    return Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
  };

  const trendData = getMonthlyTrendData();
  const maxTrendVal = Math.max(...trendData.map((d) => d.value), 5000);

  // Achievements system
  const getAchievements = () => {
    const achievementsList = [];
    if (donations.length > 0) {
      achievementsList.push({
        id: "first_gift",
        title: "First Spark",
        desc: "Initiated your journey of kindness",
        icon: "🌱",
        color: "from-green-500/20 to-emerald-600/10 text-emerald-400",
      });
    }
    if (totalDonated >= 10000) {
      achievementsList.push({
        id: "big_heart",
        title: "Golden Heart",
        desc: "Donated over ₹10,000 in support",
        icon: "💛",
        color: "from-amber-500/20 to-yellow-600/10 text-yellow-400",
      });
    }
    if (uniqueInitiatives >= 3) {
      achievementsList.push({
        id: "multi_pillar",
        title: "Cause Catalyst",
        desc: "Supported 3+ distinct initiatives",
        icon: "🌐",
        color: "from-blue-500/20 to-indigo-600/10 text-blue-400",
      });
    }
    if (successfulDonations.length >= 5) {
      achievementsList.push({
        id: "sustained_pillar",
        title: "Pillar of Trust",
        desc: "Contributed 5 times or more",
        icon: "🏛️",
        color: "from-purple-500/20 to-indigo-600/10 text-purple-400",
      });
    }
    if (totalDonated >= 50000) {
      achievementsList.push({
        id: "elite_patron",
        title: "Elite Patron",
        desc: "Crossed ₹50,000 in cumulative giving",
        icon: "🔱",
        color: "from-rose-500/20 to-pink-600/10 text-rose-400",
      });
    }
    if (achievementsList.length === 0) {
      achievementsList.push({
        id: "welcome_badge",
        title: "New Hope",
        desc: "Registered on the Trust Platform",
        icon: "🤝",
        color: "from-sky-500/20 to-blue-600/10 text-sky-400",
      });
    }
    return achievementsList;
  };

  const achievements = getAchievements();

  // Detect newly unlocked achievements
  useEffect(() => {
    if (loading) return;
    const prev = prevAchievementsRef.current.map((a) => a.id);
    const curr = achievements.map((a) => a.id);
    const fresh = curr.filter((id) => !prev.includes(id));
    let timeoutId;
    if (fresh.length > 0 && prev.length > 0) {
      setNewlyUnlocked(fresh);
      timeoutId = setTimeout(() => setNewlyUnlocked([]), 3000);
    }
    prevAchievementsRef.current = achievements;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDonated, uniqueInitiatives, successfulDonations.length, loading]);

  // Programmatic Impact Summary
  const getImpactSummary = () => {
    if (totalDonated === 0) {
      return "Welcome to the K.V.G. Shanmuka Sai family! Make your first secure contribution to unlock a metric-grounded impact synthesis. Our platform automatically computes resource allocation maps representing how your donation funds clean water filters and village schools.";
    }
    const educationAllocation = Math.round(totalDonated * 0.4);
    const foodAllocation = Math.round(totalDonated * 0.25);
    const medicalAllocation = Math.round(totalDonated * 0.2);
    return `Operational Impact Synthesis: Based on your cumulative lifetime contribution of ${formatRupee(totalDonated)}, you have funded approximately ${formatRupee(educationAllocation)} for Education Expansion (delivering evening coaching and study kits to ~${livesImpacted || 1} village kids) and ${formatRupee(foodAllocation)} for Food & Nutrition programs (furnishing ~${mealsEnabled || 5} meals). Another ${formatRupee(medicalAllocation)} has been allocated directly towards primary village medical diagnostics. Your funds operate with 100% verified integrity inside Guntur's regional hubs.`;
  };

  // PDF Download handler
  const handleDownloadReceipt = async (donationId) => {
    setDownloadingId(donationId);
    try {
      const blob = await databaseService.downloadDonationReceipt(donationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${donationId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Receipt download failed, falling back to print:", err);
      window.print();
    } finally {
      setDownloadingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Group successful donations by year for tax certificates
  const donationsByYear = successfulDonations.reduce((acc, don) => {
    let year = new Date().getFullYear();
    if (don.createdAt) {
      const d = new Date(don.createdAt);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
      }
    }
    if (!acc[year]) acc[year] = [];
    acc[year].push(don);
    return acc;
  }, {});
  const sortedYears = Object.keys(donationsByYear).sort((a, b) => b - a);

  // Tab config
  const TABS = [
    { id: "overview", label: "Overview", icon: "🏛️" },
    { id: "history", label: "Donations & Receipts", icon: "📋" },
    { id: "tax", label: "Donation Receipts", icon: "📜" },
    { id: "certificates", label: "Certificates", icon: "🏅" },
    { id: "security", label: "Security", icon: "🔒" },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0"
    >
      <div className="max-w-7xl mx-auto print:max-w-none">

        {/* ─── TOP HEADER / TAB NAV ─── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-2xl p-2 bg-brand-navy-dark text-white rounded-xl shadow-lg shadow-blue-900/20">
                🏛️
              </span>
              My Impact Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor donations, initiatives, receipts, and community updates.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="flex bg-slate-200/60 p-1 rounded-xl self-start md:self-auto border border-slate-300/30 gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-white text-brand-navy-dark shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {loading ? (
          <UserDashboardOverviewSkeleton />
        ) : (
          <AnimatePresence mode="wait">

            {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 print:hidden"
              >
                <ErrorBoundary title="Greeting & Tier Milestones" name="UserDashboardGreeting">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Greeting glassmorphic panel */}
                    <motion.div
                      variants={itemVariants}
                      className="lg:col-span-2 rounded-3xl bg-[#0F172A] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between"
                    >
                      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-widest uppercase">
                            Honored Supporter
                          </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                          Welcome Back, <br />
                          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent font-black font-heading">
                            {user?.name}
                          </span>{" "}
                          👋
                        </h2>
                        <p className="text-blue-100/80 text-sm mt-3 max-w-lg leading-relaxed">
                          Your support is the bedrock of our operations. Together,
                          we are funding real change and changing lives permanently.
                          Thank you for your continued benevolence.
                        </p>
                      </div>

                      <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="absolute w-full h-full transform -rotate-90">
                              <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="transparent" />
                              <circle
                                cx="24" cy="24" r="20"
                                stroke="#B07A3F" strokeWidth="4" fill="transparent"
                                strokeDasharray="125.6"
                                strokeDashoffset={125.6 - (125.6 * (totalDonated > 0 ? 100 : 25)) / 100}
                              />
                            </svg>
                            <span className="text-xs font-black text-brand-gold">
                              {totalDonated > 0 ? "100%" : "25%"}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-300">Profile Verified</h4>
                             <p className="text-[11px] text-blue-200/70">12A/80G Registration Pending</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            to="/donation"
                            className="px-4 py-2 bg-brand-gold hover:bg-brand-gold/90 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-gold/20"
                          >
                            Instant Gift 💝
                          </Link>
                          <button
                            onClick={() => setActiveTab("tax")}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition-all"
                          >
                            Donation Receipts 📁
                          </button>
                        </div>
                      </div>
                    </motion.div>

                    {/* Recognition Tier Card */}
                    <motion.div
                      variants={itemVariants}
                      className={`rounded-3xl border ${tier.border} p-6 flex flex-col justify-between relative overflow-hidden shadow-xl bg-gradient-to-br ${tier.bg}`}
                    >
                      <div className="absolute top-2 right-2 text-4xl opacity-20 select-none">
                        {tier.badge}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Donor Recognition Tier</span>
                        <h3 className="text-2xl font-black text-slate-800 mt-1 flex items-center gap-2">
                          <span>{tier.badge}</span> {tier.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Calculated dynamically from successful cumulative donations on this profile.
                        </p>
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-600">Tier Milestone Progress</span>
                          <span className="text-brand-gold">{Math.round(tier.progress)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tier.progress}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-brand-gold to-yellow-500 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                          <span>{formatRupee(totalDonated)}</span>
                          <span>Next: {tier.next}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-semibold">Tier Benefits:</span>
                        <span className="text-[10px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-bold">
                          Annual Reports & Receipts
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </ErrorBoundary>

                <ErrorBoundary title="Impact Statistics Summary" name="UserDashboardKPIs">
                  <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { label: "Total Contributions", value: totalDonated, isCurrency: true, icon: "💎", sub: "Voluntary contributions", accent: "border-l-4 border-l-brand-gold" },
                      { label: "Gifts Rendered", value: successfulDonations.length, isCurrency: false, icon: "📈", sub: "Successful transactions", accent: "border-l-4 border-l-blue-500" },
                      { label: "Causes Supported", value: uniqueInitiatives, isCurrency: false, icon: "🎯", sub: "Impact verticals", accent: "border-l-4 border-l-emerald-600" },
                      { label: "Achievements", value: achievements.length, isCurrency: false, icon: "🏆", sub: "Activity badges", accent: "border-l-4 border-l-purple-600" },
                      { label: "Lives Impacted", value: livesImpacted, isCurrency: false, icon: "❤️", sub: "People reached", accent: "border-l-4 border-l-rose-500" },
                      { label: "Meals Enabled", value: mealsEnabled, isCurrency: false, icon: "🍱", sub: "Nutrition provided", accent: "border-l-4 border-l-orange-500" },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className={`bg-white ${card.accent} rounded-2xl shadow-sm border border-slate-100 p-5 relative group overflow-hidden transition-all duration-300 hover:shadow-lg`}
                      >
                        <span className="absolute top-3 right-3 text-xl opacity-30 group-hover:scale-110 transition-transform duration-300">
                          {card.icon}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{card.label}</p>
                        <p className="text-xl font-black text-slate-800 mt-2 font-heading">
                          {card.isCurrency ? (
                            <span>₹<CountUp end={card.value} duration={1.5} separator="," /></span>
                          ) : (
                            <CountUp end={card.value} duration={1.2} />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">{card.sub}</p>
                      </div>
                    ))}
                  </motion.div>
                </ErrorBoundary>

                <ErrorBoundary title="Impact Assessment" name="UserDashboardOperationalSynthesis">
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-transparent border border-amber-500/10 rounded-3xl p-6 relative overflow-hidden group shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-indigo-500/10 rounded-bl-full opacity-50 blur-xl group-hover:scale-125 transition-transform duration-500" />
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl animate-pulse select-none">✨</span>
                      <div>
                        <h4 className="text-sm font-black text-brand-navy-dark tracking-tight">Personalized Impact Assessment</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dynamic operational synthesis of your financial investments</p>
                      </div>
                    </div>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.7 }} className="text-slate-600 max-w-5xl">
                      {getImpactSummary()}
                    </Typography>
                  </motion.div>
                </ErrorBoundary>

                <ErrorBoundary title="Analytics & Achievements" name="UserDashboardAnalytics">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Giving Trends Chart */}
                    <motion.div
                      variants={itemVariants}
                      className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span>📊</span> Giving Trend Visualization
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">Custom computed graph reflecting past 6-month investments.</p>
                      </div>

                      <div className="h-56 w-full mt-6 relative flex items-end">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                          {[1, 2, 3].map((_, i) => (
                            <div key={i} className="w-full border-t border-dashed border-slate-100" />
                          ))}
                        </div>
                        <div className="relative z-10 w-full h-40 flex items-end justify-between px-2 gap-4 pb-1">
                          {trendData.map((data, idx) => {
                            const pct = maxTrendVal > 0 ? (data.value / maxTrendVal) * 100 : 0;
                            return (
                              <div key={data.name} className="flex-1 flex flex-col items-center group h-full justify-end">
                                <div className="w-full relative flex justify-center">
                                  <div className="absolute bottom-full mb-2 bg-brand-navy-dark text-white text-[10px] font-black px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                                    {formatRupee(data.value)}
                                  </div>
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(pct, 4)}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    className={`w-8 sm:w-12 rounded-t-lg transition-all duration-300 ${
                                      data.value > 0
                                        ? "bg-gradient-to-t from-brand-navy-dark to-brand-blue-accent group-hover:from-brand-gold group-hover:to-amber-500 shadow-md shadow-blue-500/10"
                                        : "bg-slate-100 border border-dashed border-slate-200"
                                    }`}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">
                                  {data.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-brand-blue-accent rounded-full inline-block" /> Success Contributions
                        </span>
                        <span>Showing last 6 active months</span>
                      </div>
                    </motion.div>

                    {/* Achievements */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <span>🏆</span> Impact Accomplishments
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">Badges earned through platform participation milestones.</p>
                      </div>

                      <div className="space-y-3 my-5 overflow-y-auto max-h-64 pr-1">
                        {achievements.map((ach) => {
                          const isNew = newlyUnlocked.includes(ach.id);
                          return (
                            <motion.div
                              key={ach.id}
                              animate={isNew ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px rgba(251,191,36,0)", "0 0 18px rgba(251,191,36,0.5)", "0 0 0px rgba(251,191,36,0)"] } : {}}
                              transition={{ duration: 0.6, repeat: isNew ? 3 : 0 }}
                              className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
                            >
                              <span className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br ${ach.color} shadow-sm border border-white/40`}>
                                {ach.icon}
                              </span>
                              <div>
                                <h4 className="text-xs font-black text-slate-800">{ach.title}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{ach.desc}</p>
                              </div>
                              {isNew && (
                                <span className="ml-auto text-[9px] bg-amber-400/20 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-black uppercase">New!</span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                          Expand giving to unlock more honors
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </ErrorBoundary>

                {/* Stories & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>📖</span> Recommended Impact Stories
                      </h3>
                      <Link to="/about" className="text-xs font-extrabold text-brand-gold hover:underline">
                        All stories →
                      </Link>
                    </div>
                    {recommendedStories.length === 0 ? (
                      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
                        <p className="text-slate-400 text-xs">Stories are currently being compiled by the editorial team.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {recommendedStories.map((story) => (
                          <Link to={`/stories/${story.id}`} key={story.id} className="group">
                            <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
                              <div className="h-32 bg-slate-200 relative overflow-hidden">
                                <img
                                  src={story.beforeImageUrl || story.afterImageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&auto=format"}
                                  alt={story.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-2 left-2 bg-brand-navy-dark text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                                  {story.category || "Success Story"}
                                </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1 group-hover:text-brand-gold transition-colors">
                                    {story.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                    {story.subtitle || stripHtml(story.description)}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold">
                                  <span className="text-slate-500">📍 {story.location || "Impact Site"}</span>
                                  <span className="text-brand-blue-accent group-hover:translate-x-1 transition-transform">Read Story →</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span>⚡</span> Instant Portal Actions
                    </h3>
                    <div className="bg-white rounded-3xl p-5 border border-slate-100 grid grid-cols-2 gap-3">
                      {[
                        { to: "/donation", emoji: "💝", label: "Donate Funds", sub: "Voluntary donation", hover: "hover:border-amber-200 hover:bg-amber-500/5" },
                        { to: "/events", emoji: "📅", label: "Initiatives", sub: "Volunteer / Attend", hover: "hover:border-blue-200 hover:bg-blue-500/5" },
                        { to: "/volunteer", emoji: "🤝", label: "Join Roster", sub: "Volunteer drive", hover: "hover:border-emerald-200 hover:bg-emerald-500/5" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex flex-col items-center justify-center p-4 bg-slate-50 ${item.hover} rounded-2xl border border-transparent transition-all group text-center`}
                        >
                          <span className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
                          <span className="text-xs font-black text-slate-800">{item.label}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">{item.sub}</span>
                        </Link>
                      ))}
                      <button
                        onClick={() => setActiveTab("tax")}
                        className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-500/5 rounded-2xl hover:border-purple-200 border border-transparent transition-all group text-center"
                      >
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">📜</span>
                        <span className="text-xs font-black text-slate-800">Receipts</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">Donation receipts</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ DONATIONS & RECEIPTS TAB ═══════════════ */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 print:hidden"
              >
                {/* Filter bar */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                      type="text"
                      placeholder="Search by receipt or cause..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-700 outline-none transition-all"
                    />
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                    {["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all ${
                          filterStatus === status
                            ? "bg-white text-brand-navy-dark shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Timeline */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl">
                  {filteredDonations.length === 0 ? (
                    <div className="p-16 text-center">
                      <span className="text-6xl block">💝</span>
                      <h3 className="text-lg font-bold text-slate-700 mt-4">No donation slips match criteria</h3>
                      <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                        Verify that spelling is correct or status filters align with your past transactions.
                      </p>
                      <button
                        onClick={() => { setFilterStatus("ALL"); setSearchQuery(""); }}
                        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {filteredDonations.map((don, idx) => (
                        <motion.div
                          key={don.id || idx}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-all group border-b border-slate-50 last:border-0"
                        >
                          {/* Timeline dot & status / mobile amount */}
                          <div className="flex items-center justify-between w-full sm:w-auto flex-shrink-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                don.status === "SUCCESS" ? "border-emerald-200 bg-emerald-50" :
                                don.status === "FAILED" ? "border-rose-200 bg-rose-50" :
                                don.status === "REFUNDED" ? "border-purple-200 bg-purple-50" :
                                "border-amber-200 bg-amber-50"
                              }`}>
                                <StatusIcon status={don.status} size={18} />
                              </div>
                              <span className="sm:hidden text-xs font-mono font-bold text-brand-navy-dark px-2 py-0.5 rounded bg-slate-100">
                                {don.receiptNumber || "Pending"}
                              </span>
                            </div>
                            <div className="sm:hidden text-right">
                              <p className="text-sm font-black text-slate-800">{formatRupee(don.amount)}</p>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="hidden sm:inline-block text-xs font-mono font-bold text-brand-navy-dark px-2 py-0.5 rounded bg-slate-100 group-hover:bg-brand-navy-dark group-hover:text-white transition-colors">
                                {don.receiptNumber || "Pending"}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                don.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                don.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                don.status === "REFUNDED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                <StatusIcon status={don.status} size={10} />
                                {don.status || "PENDING"}
                              </span>
                              {don.donorPanMasked && (
                                <MaskedPan masked={don.donorPanMasked} />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              {don.eventTitle || "General Trust Initiative"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <AccessTimeIcon sx={{ fontSize: 11 }} />
                              {safeFormatDate(don.createdAt)}
                            </p>
                          </div>

                          {/* Amount (desktop only) */}
                          <div className="hidden sm:block flex-shrink-0 text-right">
                            <p className="text-sm font-black text-slate-800">{formatRupee(don.amount)}</p>
                          </div>

                          {/* Download & View actions */}
                          <div className="flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 flex items-center gap-2">
                            {don.status === "SUCCESS" ? (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Tooltip title="Download PDF Receipt" arrow>
                                  <button
                                    onClick={() => handleDownloadReceipt(don.id)}
                                    disabled={downloadingId === don.id}
                                    className="flex-1 sm:flex-none text-xs text-brand-gold hover:underline font-extrabold inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all border border-amber-100 sm:border-0 disabled:opacity-60"
                                  >
                                    {downloadingId === don.id ? (
                                      <CircularProgress size={12} sx={{ color: "#B07A3F" }} />
                                    ) : (
                                      <DownloadIcon sx={{ fontSize: 14 }} />
                                    )}
                                    PDF
                                  </button>
                                </Tooltip>
                                <Tooltip title="View Receipt" arrow>
                                  <button
                                    onClick={() => setSelectedReceipt(don)}
                                    className="text-xs text-slate-500 hover:text-slate-800 font-extrabold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                                  >
                                    <ArticleIcon sx={{ fontSize: 14 }} />
                                    View
                                  </button>
                                </Tooltip>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic font-semibold">
                                {don.status === "REFUNDED" ? "Refunded" : "Locked"}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════ TAX CERTIFICATES TAB ═══════════════ */}
            {activeTab === "tax" && (
              <motion.div
                key="tax"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Donation Summary Banner */}
                <div className="rounded-3xl bg-gradient-to-r from-amber-600 to-amber-500 p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="absolute left-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mb-8" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <VerifiedIcon sx={{ fontSize: 20, color: "rgba(255,255,255,0.9)" }} />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-100">Donation Receipt — K.V.G. Shanmuka Sai Charitable Trust</span>
                      </div>
                      <h2 className="text-2xl font-black leading-tight">Donation Receipt Center</h2>
                      <p className="text-amber-100/80 text-sm mt-1 max-w-md">
                        The Trust's applicable tax registration/approval is currently under process. No tax benefit or deduction is being promised at this time.
                      </p>
                    </div>
                    <div className="bg-white/15 backdrop-blur rounded-2xl p-5 text-center min-w-[140px]">
                      <p className="text-xs font-bold text-amber-100 uppercase tracking-wide">Status</p>
                      <p className="text-xl font-black mt-1">
                        PENDING
                      </p>
                      <p className="text-[10px] text-amber-200 mt-1">12A & 80G Approval</p>
                    </div>
                  </div>
                </div>

                {/* If no successful donations */}
                {successfulDonations.length === 0 && (
                  <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">

                    <WorkspacePremiumIcon sx={{ fontSize: 64, color: "#e2e8f0", mb: 2 }} />
                    <h3 className="text-lg font-bold text-slate-700">No receipts yet</h3>
                    <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
                      Make a successful donation to view your receipt.
                    </p>
                    <Link
                      to="/donation"
                      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold text-white text-xs font-bold rounded-xl transition-all hover:bg-brand-gold/90 shadow-md"
                    >
                      💝 Donate Now
                    </Link>
                  </div>
                )}

                {/* Year-grouped Certificates */}
                {sortedYears.map((year) => {
                  const yearDons = donationsByYear[year] || [];
                  const yearTotal = yearDons.reduce((s, d) => s + Number(d.amount || 0), 0);
                  const yearDeduction = Math.round(yearTotal * 0.5);

                  return (
                    <motion.div
                      key={year}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Year Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-white bg-brand-navy-dark px-3 py-1.5 rounded-xl">
                            FY {year}–{String(parseInt(year) + 1).slice(-2)}
                          </span>
                          <div>
                            <p className="text-sm font-black text-slate-800">Total Donated: {formatRupee(yearTotal)}</p>
                            <p className="text-[11px] text-slate-500 font-bold">Tax Exemption: Pending Approval</p>
                          </div>
                        </div>
                      </div>

                      {/* Donation certificate cards */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {yearDons.map((don) => (
                          <motion.div
                            key={don.id}
                            whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all"
                          >
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-amber-500/8 to-indigo-500/5 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <WorkspacePremiumIcon sx={{ fontSize: 20, color: "#B07A3F" }} />
                                <span className="text-xs font-black text-slate-800">
                                  {don.receiptNumber || `DON-${don.id}`}
                                </span>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                don.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}>
                                <StatusIcon status={don.status} size={10} />
                                {don.status}
                              </span>
                            </div>

                            {/* Card Body */}
                            <div className="px-6 py-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</p>
                                  <p className="text-xl font-black text-slate-900">{formatRupee(don.amount)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Status</p>
                                  <p className="text-[11px] font-bold text-amber-600 mt-1">Pending Approval</p>
                                </div>
                              </div>

                              <Divider />

                              <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <div>
                                  <p className="text-slate-400 font-bold">Initiative</p>
                                  <p className="text-slate-700 font-extrabold mt-0.5 line-clamp-1">
                                    {don.eventTitle || "General Trust Fund"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-bold">Date</p>
                                  <p className="text-slate-700 font-extrabold mt-0.5">
                                    {safeFormatDate(don.createdAt)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-bold flex items-center gap-1">
                                    <LockIcon sx={{ fontSize: 10 }} /> PAN Card
                                  </p>
                                  <div className="mt-0.5">
                                    {don.donorPanMasked ? (
                                      <MaskedPan masked={don.donorPanMasked} />
                                    ) : (
                                      <span className="text-slate-400 italic text-[10px]">Not provided</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-bold flex items-center gap-1">
                                    <HomeIcon sx={{ fontSize: 10 }} /> Address
                                  </p>
                                  <p className="mt-0.5 text-[10px]">
                                    {don.donorAddress ? (
                                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircleIcon sx={{ fontSize: 12 }} /> Filed
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">Not provided</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* 80G Indicator */}
                              <div className={`rounded-xl p-3 flex items-center gap-2 text-[11px] font-bold ${
                                don.status === "SUCCESS"
                                  ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                                  : "bg-slate-50 border border-slate-100 text-slate-500"
                              }`}>
                                {don.status === "SUCCESS" ? (
                                  <>
                                    <VerifiedIcon sx={{ fontSize: 16, color: "#059669" }} />
                                    Receipt Ready — Exemption Pending
                                  </>
                                ) : (
                                  <>
                                    <PendingIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                                    Receipt pending payment confirmation
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Card Actions */}
                            {don.status === "SUCCESS" && (
                              <div className="px-6 pb-5 flex gap-3">
                                <Button
                                  fullWidth
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  startIcon={
                                    downloadingId === don.id
                                      ? <CircularProgress size={12} color="inherit" />
                                      : <DownloadIcon />
                                  }
                                  disabled={downloadingId === don.id}
                                  onClick={() => handleDownloadReceipt(don.id)}
                                  sx={{ py: 1, borderRadius: 2.5, fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}
                                >
                                  {downloadingId === don.id ? "Generating..." : "Download PDF"}
                                </Button>
                                <Button
                                  fullWidth
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                  startIcon={<ArticleIcon />}
                                  onClick={() => setSelectedReceipt(don)}
                                  sx={{ py: 1, borderRadius: 2.5, fontWeight: 700, textTransform: "none", fontSize: "0.75rem" }}
                                >
                                  Preview
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === "certificates" && (
              <motion.div key="certificates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <IssuedCertificates />
              </motion.div>
            )}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <SecurityPanel />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* ─── DYNAMIC PRINTABLE 80G RECEIPT MODAL ─── */}
      <Dialog
        open={selectedReceipt !== null}
        onClose={() => setSelectedReceipt(null)}
        maxWidth="sm"
        fullWidth
        scroll="body"
        PaperProps={{
          sx: { borderRadius: 6, overflow: "hidden", p: 0, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
        }}
      >
        <DialogContent className="p-8 relative bg-white">
          <div className="print-content">

            {/* Success icon (Hidden on print) */}
            <Box className="text-center mb-6 print:hidden">
              <CheckCircleIcon color="success" sx={{ fontSize: 52, mb: 1 }} />
              <Typography variant="h6" className="font-extrabold text-slate-800">
                Official Donation Receipt Reconciled
              </Typography>
            </Box>

            {/* Official Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-5 mb-6">
              <div>
                <Typography variant="subtitle1" className="font-black text-amber-700 tracking-tight leading-tight">
                  K.V.G. SHANMUKA SAI CHARITABLE TRUST
                </Typography>
                <Typography variant="caption" className="block text-slate-400 font-bold leading-normal">
                  49a, Harischandrapuram, Thullur mandal, Guntur district, Andhra pradesh, India
                </Typography>
              </div>
              <div className="text-left sm:text-right">
                <Typography variant="subtitle2" className="font-extrabold text-slate-700">DONATION RECEIPT</Typography>
                <Typography variant="caption" className="block font-mono font-bold text-amber-600">
                  {selectedReceipt?.receiptNumber || "REC-PENDING"}
                </Typography>
              </div>
            </div>

            {/* Receipt Details Grid */}
            <Grid container spacing={3} className="mb-6 text-xs">
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" className="font-black uppercase tracking-wider text-slate-400 block mb-1">Donor Details</Typography>
                <Typography variant="subtitle2" className="font-extrabold text-slate-800">{selectedReceipt?.donorName || user?.name}</Typography>
                <Typography variant="body2" className="text-slate-500 font-semibold">{selectedReceipt?.donorEmail || user?.email}</Typography>
                {/* Masked PAN in receipt */}
                {(selectedReceipt?.donorPanMasked || selectedReceipt?.donorPan) && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <LockIcon sx={{ fontSize: 12, color: "#64748b" }} />
                    <Typography variant="caption" className="font-bold text-slate-500">PAN:</Typography>
                    <MaskedPan masked={selectedReceipt?.donorPanMasked} pan={selectedReceipt?.donorPan} />
                  </div>
                )}
                {selectedReceipt?.donorAddress && (
                  <div className="mt-1 flex items-start gap-1.5">
                    <HomeIcon sx={{ fontSize: 12, color: "#64748b", mt: "1px" }} />
                    <Typography variant="caption" className="font-semibold text-slate-500 leading-relaxed">
                      {selectedReceipt?.donorAddress}
                    </Typography>
                  </div>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" className="font-black uppercase tracking-wider text-slate-400 block mb-1">Transaction Details</Typography>
                <Typography variant="body2" className="font-semibold text-slate-600">
                  Transaction ID: <span className="font-mono text-slate-800 font-bold">{selectedReceipt?.transactionId || "N/A"}</span>
                </Typography>
                <Typography variant="body2" className="font-semibold text-slate-600">
                  Date: <span className="font-bold text-slate-800">
                    {safeFormatDate(selectedReceipt?.createdAt, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </Typography>
              </Grid>
            </Grid>

            {/* Donation Receipt Status Box */}
            <Box className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-6 print:border print:border-black">
              <Typography variant="subtitle2" className="font-extrabold text-amber-800 leading-tight mb-1">
                Donation Receipt Status: ACKNOWLEDGEMENT ONLY
              </Typography>
              <Typography variant="caption" className="leading-relaxed block text-slate-500 font-semibold">
                This receipt serves as a transaction acknowledgement of your donation to K.V.G. Shanmuka Sai Charitable Trust. Please note: The trust's applicable tax registration/approval is currently under process. No tax benefit or deduction is being promised at this time.
              </Typography>
            </Box>

            <Divider className="my-5 border-slate-350 print:border-t-2 print:border-black" />

            {/* Total box */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-2xl p-4 print:bg-none print:border-none print:p-0">
              <div>
                <Typography variant="subtitle2" className="font-bold text-slate-400">Total Gift Amount</Typography>
                {selectedReceipt?.message && (
                  <Typography variant="caption" className="italic text-slate-500 mt-0.5 block">
                    Message: "{selectedReceipt?.message}"
                  </Typography>
                )}
              </div>
              <Typography variant="h4" className="font-black text-amber-700 font-heading">
                {selectedReceipt ? formatRupee(selectedReceipt.amount) : "₹0"}
              </Typography>
            </div>

            <div className="text-center mt-6 hidden print:block border-t border-slate-200 pt-4 text-[10px] text-slate-450 font-bold">
              Thank you for supporting K.V.G. Shanmuka Sai Charitable Trust. This is a computer-generated donation receipt. No physical signature required.
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 print:hidden">
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={
                downloadingId === selectedReceipt?.id
                  ? <CircularProgress size={14} color="inherit" />
                  : <DownloadIcon />
              }
              disabled={downloadingId === selectedReceipt?.id}
              onClick={() => handleDownloadReceipt(selectedReceipt?.id)}
              sx={{ py: 1.2, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
            >
              {downloadingId === selectedReceipt?.id ? "Generating PDF..." : "Download PDF Receipt"}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={() => window.print()}
              sx={{ py: 1.2, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
            >
              Print Receipt
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={() => setSelectedReceipt(null)}
              sx={{ py: 1.2, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default UserDashboard;
