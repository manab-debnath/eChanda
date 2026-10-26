import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Share2,
  Check,
  Copy,
  AlertCircle,
  ShieldCheck,
  Banknote,
  CreditCard,
  ShoppingBag,
  Layers,
  Sparkles,
  UserCheck,
  UserMinus,
  Search,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type {
  Club,
  CollectionItem,
  ExpenseItem,
  Member,
  MemberRole,
} from "../types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { CollectionModal } from "../components/CollectionModal";
import { ExpenseModal } from "../components/ExpenseModal";

type TabType = "overview" | "collections" | "expenses" | "members";

export function ClubDetailsPage() {
  const { clubID } = useParams<{ clubID: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalCollections, setTotalCollections] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // Modals state
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<CollectionItem | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(
    null,
  );

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Determine current user's role in this club
  const currentMember = useMemo(() => {
    if (!user || !members.length) return null;
    return members.find((m) => m.id === user.id) || null;
  }, [user, members]);

  const userRole: MemberRole | "none" = currentMember
    ? currentMember.role
    : "none";
  const canManageMoney = userRole === "admin" || userRole === "collector";
  const isAdmin = userRole === "admin";

  const fetchClubData = async () => {
    if (!clubID) return;
    setIsLoading(true);
    setError(null);
    setPermissionNotice(null);

    try {
      // 1. Fetch club info and members
      const [clubData, membersData] = await Promise.all([
        api.clubs.getById(clubID),
        api.clubs.getMembers(clubID).catch(() => [] as Member[]),
      ]);

      setClub(clubData);
      setMembers(membersData);

      // Check current user role
      const member = membersData.find((m) => m.id === user?.id);
      const role = member ? member.role : null;

      if (role === "admin" || role === "collector") {
        // Fetch collections, expenses, and totals in parallel
        const [collRes, expRes, collTot, expTot] = await Promise.allSettled([
          api.collections.getAll(clubID),
          api.expenses.getAll(clubID),
          api.collections.getTotal(clubID),
          api.expenses.getTotal(clubID),
        ]);

        if (collRes.status === "fulfilled") setCollections(collRes.value || []);
        if (expRes.status === "fulfilled") setExpenses(expRes.value || []);
        if (collTot.status === "fulfilled") {
          setTotalCollections(parseFloat(collTot.value.total_collections) || 0);
        }
        if (expTot.status === "fulfilled") {
          setTotalExpenses(parseFloat(expTot.value.total_expenses) || 0);
        }
      } else if (role === "viewer") {
        setPermissionNotice(
          "You are a Viewer in this club. Ask an Admin to promote you to Collector to record and view donations & expenses.",
        );
      } else {
        setPermissionNotice("You are not yet a member of this club.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load club details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [clubID]);

  const handleJoinClub = async () => {
    if (!clubID) return;
    try {
      await api.clubs.join(clubID);
      await fetchClubData();
    } catch (err: any) {
      alert(err?.message || "Failed to join club");
    }
  };

  const handleUpdateMemberRole = async (
    targetUserId: string,
    newRole: "collector" | "viewer",
  ) => {
    if (!clubID) return;
    setUpdatingUserId(targetUserId);
    try {
      await api.clubs.updateMemberRole(clubID, targetUserId, newRole);
      // Update local member role
      setMembers((prev) =>
        prev.map((m) => (m.id === targetUserId ? { ...m, role: newRole } : m)),
      );
    } catch (err: any) {
      alert(err?.message || "Failed to update member role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCopyClubId = () => {
    if (!clubID) return;
    navigator.clipboard.writeText(clubID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const netBalance = totalCollections - totalExpenses;

  // Filter collections
  const filteredCollections = useMemo(() => {
    if (!searchFilter.trim()) return collections;
    const q = searchFilter.toLowerCase();
    return collections.filter((c) => c.donor_name.toLowerCase().includes(q));
  }, [collections, searchFilter]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    if (!searchFilter.trim()) return expenses;
    const q = searchFilter.toLowerCase();
    return expenses.filter(
      (e) =>
        e.product_name.toLowerCase().includes(q) ||
        e.quantity?.toLowerCase().includes(q),
    );
  }, [expenses, searchFilter]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Club not found or inaccessible
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {error || "We couldn't retrieve the details for this club."}
        </p>
        <Link to="/">
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <ArrowLeft className="size-4" />
            Back to Clubs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 sm:pb-16">
      {/* Top Header / Back Nav */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 pt-4 pb-5 px-4 sticky top-14 sm:top-16 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>All Clubs</span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyClubId}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2.5 py-1 rounded-lg font-mono transition-colors"
                title="Copy Club ID to share with friends"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-sans font-medium text-[11px]">
                      ID Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5 text-slate-400" />
                    <span className="text-[11px] font-sans">Share ID</span>
                  </>
                )}
              </button>

              <Badge
                variant={club.status === "active" ? "success" : "secondary"}
                className="capitalize text-[11px]"
              >
                {club.status}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {club.title}
                </h1>
                {currentMember && (
                  <Badge
                    variant={
                      currentMember.role === "admin"
                        ? "purple"
                        : currentMember.role === "collector"
                          ? "info"
                          : "outline"
                    }
                    className="capitalize text-[10px]"
                  >
                    {currentMember.role}
                  </Badge>
                )}
              </div>

              {club.description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {club.description}
                </p>
              )}
            </div>

            {/* Quick action buttons for collectors/admins */}
            {canManageMoney && (
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <Button
                  size="sm"
                  onClick={() => setIsAddCollectionOpen(true)}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl shadow-xs shadow-emerald-600/20"
                >
                  <Plus className="size-4" />
                  <span>Add Chanda</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="text-xs h-9 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 gap-1.5 rounded-xl"
                >
                  <Plus className="size-4" />
                  <span>Expense</span>
                </Button>
              </div>
            )}

            {!currentMember && (
              <Button
                size="sm"
                onClick={handleJoinClub}
                className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl"
              >
                <UserCheck className="size-4" />
                Join this Club
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-5 space-y-6">
        {/* Permission Notice Banner */}
        {permissionNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
            <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Viewer Notice</p>
              <p className="mt-0.5 text-xs opacity-90">{permissionNotice}</p>
            </div>
            {!currentMember && (
              <Button
                size="sm"
                onClick={handleJoinClub}
                className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                Join Now
              </Button>
            )}
          </div>
        )}

        {/* Financial KPI Cards */}
        {canManageMoney && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Collections */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <CardContent className="p-4 pt-4.5">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Collections
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="size-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(totalCollections)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>{collections.length} donations recorded</span>
                </div>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
              <CardContent className="p-4 pt-4.5">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Total Expenses
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="size-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>{expenses.length} purchases recorded</span>
                </div>
              </CardContent>
            </Card>

            {/* Net Balance */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden relative">
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  netBalance >= 0 ? "bg-teal-500" : "bg-amber-500"
                }`}
              />
              <CardContent className="p-4 pt-4.5">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Net Balance
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      netBalance >= 0
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-950/50"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/50"
                    }`}
                  >
                    <Wallet className="size-4" />
                  </div>
                </div>
                <div
                  className={`text-2xl font-black tracking-tight ${
                    netBalance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600"
                  }`}
                >
                  {formatCurrency(netBalance)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {netBalance >= 0
                    ? "Surplus in fund"
                    : "Deficit (Expenses exceed chanda)"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Controls */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(
              [
                { id: "overview", label: "Overview", icon: Sparkles },
                {
                  id: "collections",
                  label: `Collections (${collections.length})`,
                  icon: TrendingUp,
                },
                {
                  id: "expenses",
                  label: `Expenses (${expenses.length})`,
                  icon: TrendingDown,
                },
                {
                  id: "members",
                  label: `Members (${members.length})`,
                  icon: Users,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchFilter("");
                  }}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all shrink-0 ${
                    isActive
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Club Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400">Club ID (UUID)</span>
                  <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-slate-700 dark:text-slate-300">
                    <span className="truncate flex-1">{club.id}</span>
                    <button
                      type="button"
                      onClick={handleCopyClubId}
                      className="text-slate-400 hover:text-emerald-600"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">Status</span>
                  <div className="p-2">
                    <Badge
                      variant={
                        club.status === "active" ? "success" : "secondary"
                      }
                      className="capitalize text-xs"
                    >
                      {club.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">Start Date</span>
                  <div className="p-2 font-medium text-slate-700 dark:text-slate-200">
                    {formatDate(club.start_date) || "Not set"}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">End Date</span>
                  <div className="p-2 font-medium text-slate-700 dark:text-slate-200">
                    {formatDate(club.end_date) || "Ongoing (No end date)"}
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick recent activity */}
            {canManageMoney && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Recent Collections */}
                <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Recent Donations
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab("collections")}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  {collections.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No collections recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {collections.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {c.donor_name}
                            </span>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {c.collector_name && (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  by {c.collector_name}
                                </span>
                              )}
                              {c.phone_number && (
                                <span className="font-mono">
                                  • {c.phone_number}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-emerald-600">
                            +{formatCurrency(c.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Recent Expenses */}
                <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Recent Expenses
                    </h4>
                    <button
                      type="button"
                      onClick={() => setActiveTab("expenses")}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  {expenses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      No expenses recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {expenses.slice(0, 4).map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {e.product_name}
                            </span>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>Qty: {e.quantity}</span>
                              {e.added_by_name && (
                                <span className="text-rose-700 dark:text-rose-400 font-medium">
                                  • by {e.added_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-rose-600">
                            -{formatCurrency(e.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COLLECTIONS */}
        {activeTab === "collections" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter by donor name..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm bg-white dark:bg-slate-900 rounded-xl"
                />
              </div>

              {canManageMoney && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCollection(null);
                    setIsAddCollectionOpen(true);
                  }}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl shrink-0"
                >
                  <Plus className="size-4" />
                  <span>Add Collection</span>
                </Button>
              )}
            </div>

            {filteredCollections.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-dashed border-slate-300 dark:border-slate-800 bg-white/50">
                <Banknote className="size-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {searchFilter
                    ? "No collections match your filter."
                    : "No collections yet"}
                </p>
                {canManageMoney && !searchFilter && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddCollectionOpen(true)}
                    className="text-xs mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Add first donation
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredCollections.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                        {c.payment_mode === "online" ? (
                          <CreditCard className="size-4.5" />
                        ) : (
                          <Banknote className="size-4.5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {c.donor_name}
                          </span>
                          {c.payment_mode && (
                            <Badge
                              variant={
                                c.payment_mode === "online" ? "info" : "success"
                              }
                              className="capitalize text-[10px] px-1.5 py-0"
                            >
                              {c.payment_mode}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {c.collector_name && (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                              <UserCheck className="size-3" />
                              Collected by {c.collector_name}
                            </span>
                          )}
                          {c.phone_number && (
                            <span className="font-mono text-slate-400">
                              • {c.phone_number}
                            </span>
                          )}
                          {c.collected_at && (
                            <span className="text-slate-400">
                              • {formatDate(c.collected_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-emerald-600">
                        +{formatCurrency(c.amount)}
                      </span>

                      {canManageMoney && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCollection(c);
                            setIsAddCollectionOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit donation"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPENSES */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter expenses by item name..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm bg-white dark:bg-slate-900 rounded-xl"
                />
              </div>

              {canManageMoney && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingExpense(null);
                    setIsAddExpenseOpen(true);
                  }}
                  className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 rounded-xl shrink-0"
                >
                  <Plus className="size-4" />
                  <span>Add Expense</span>
                </Button>
              )}
            </div>

            {filteredExpenses.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-dashed border-slate-300 dark:border-slate-800 bg-white/50">
                <ShoppingBag className="size-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {searchFilter
                    ? "No expenses match your filter."
                    : "No expenses recorded yet"}
                </p>
                {canManageMoney && !searchFilter && (
                  <Button
                    size="sm"
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="text-xs mt-3 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Record first expense
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((e) => (
                  <div
                    key={e.id}
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-rose-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                        <ShoppingBag className="size-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {e.product_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span>Qty: {e.quantity}</span>
                          {e.added_by_name && (
                            <span className="inline-flex items-center gap-1 font-medium text-rose-700 dark:text-rose-400">
                              • Added by {e.added_by_name}
                            </span>
                          )}
                          {e.created_at && (
                            <span className="text-slate-400">
                              • {formatDate(e.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-rose-600">
                        -{formatCurrency(e.amount)}
                      </span>

                      {canManageMoney && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExpense(e);
                            setIsAddExpenseOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEMBERS */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Club Members ({members.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Admins can assign Collector role to members or remove
                  collectors back to Viewer.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyClubId}
                className="text-xs gap-1.5 h-8"
              >
                <Share2 className="size-3.5" />
                Invite
              </Button>
            </div>

            <div className="space-y-2">
              {members.map((m) => {
                const isCurrentUser = m.id === user?.id;
                const canPromote =
                  isAdmin && m.role === "viewer" && !isCurrentUser;
                const canDemote =
                  isAdmin && m.role === "collector" && !isCurrentUser;

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {m.name}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] text-slate-400">
                              (You)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {m.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          m.role === "admin"
                            ? "purple"
                            : m.role === "collector"
                              ? "info"
                              : "outline"
                        }
                        className="capitalize text-xs"
                      >
                        {m.role}
                      </Badge>

                      {canPromote && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingUserId === m.id}
                          onClick={() =>
                            handleUpdateMemberRole(m.id, "collector")
                          }
                          className="text-xs h-7 px-2.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          {updatingUserId === m.id
                            ? "Updating..."
                            : "Make Collector"}
                        </Button>
                      )}

                      {canDemote && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingUserId === m.id}
                          onClick={() => handleUpdateMemberRole(m.id, "viewer")}
                          className="text-xs h-7 px-2.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          {updatingUserId === m.id
                            ? "Updating..."
                            : "Remove Collector"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Collection Modal */}
      {clubID && (
        <CollectionModal
          isOpen={isAddCollectionOpen}
          onClose={() => {
            setIsAddCollectionOpen(false);
            setEditingCollection(null);
          }}
          clubId={clubID}
          initialData={editingCollection}
          onSaved={() => fetchClubData()}
        />
      )}

      {/* Expense Modal */}
      {clubID && (
        <ExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setEditingExpense(null);
          }}
          clubId={clubID}
          initialData={editingExpense}
          onSaved={() => fetchClubData()}
        />
      )}
    </div>
  );
}
