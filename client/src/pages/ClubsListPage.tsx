import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Wallet,
  Calendar,
  Users,
  Search,
  PlusCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Compass,
  AlertCircle,
  UserCheck,
  LogIn,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Club } from "../types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { CreateClubModal } from "../components/CreateClubModal";
import { JoinClubModal } from "../components/JoinClubModal";
import toast from "react-hot-toast";

type ViewScope = "joined" | "all";

export function ClubsListPage() {
  const { user } = useAuth();
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [viewScope, setViewScope] = useState<ViewScope>("joined");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const fetchClubs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allData, joinedData] = await Promise.all([
        api.clubs.getAll().catch(() => [] as Club[]),
        api.clubs.getJoinedClubs().catch(() => [] as Club[]),
      ]);
      setAllClubs(allData || []);
      setJoinedClubs(joinedData || []);
    } catch (err: any) {
      setError(
        err?.message || "Failed to load clubs. Please check your backend.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClubCreated = (newClub: Club) => {
    setAllClubs((prev) => [newClub, ...prev]);
    setJoinedClubs((prev) => [newClub, ...prev]);
  };

  const handleClubJoined = async (clubId: string) => {
    await fetchClubs();
  };

  const handleInlineJoin = async (e: React.MouseEvent, clubId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setJoiningClubId(clubId);
    try {
      await api.clubs.join(clubId);
      await fetchClubs();
    } catch (err: any) {
      toast.error("Failed to join club");
    } finally {
      setJoiningClubId(null);
    }
  };

  const joinedClubIds = useMemo(() => {
    return new Set(joinedClubs.map((c) => c.id));
  }, [joinedClubs]);

  const displayedClubs = viewScope === "joined" ? joinedClubs : allClubs;

  const filteredClubs = displayedClubs.filter((club) => {
    const matchesSearch =
      club.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true : club.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="pb-20 sm:pb-12">
      {/* Hero / Quick Stats Greeting */}
      <section className="bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800 pt-6 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs tracking-wide uppercase">
                <Sparkles className="size-3.5" />
                <span>Dashboard</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Hello, {user?.name || "Organizer"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your event collections, track expenses, and view live
                totals.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsJoinOpen(true)}
                className="text-xs h-9 gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs font-medium"
              >
                <Compass className="size-4 text-slate-500" />
                Join with ID
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 font-medium"
              >
                <PlusCircle className="size-4" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* View Scope Tabs (My Joined Events vs All Events) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setViewScope("joined")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewScope === "joined"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="size-3.5" />
              <span>Joined Events ({joinedClubs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewScope("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewScope === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Compass className="size-3.5" />
              <span>All Events ({allClubs.length})</span>
            </button>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            {(["all", "active", "completed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 ${
                  statusFilter === status
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder={
              viewScope === "joined"
                ? "Search your joined events..."
                : "Search all events or event names..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs sm:text-sm bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load events</p>
              <p className="mt-0.5 text-xs opacity-90">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClubs}
              className="text-xs h-7 border-rose-300 bg-white dark:bg-slate-900"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-sm w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-sm w-2/3" />
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-sm w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClubs.length === 0 && (
          <Card className="border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Wallet className="size-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {viewScope === "joined"
                ? "No joined events found"
                : "No events found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery
                ? `No events match "${searchQuery}". Try clearing your search.`
                : viewScope === "joined"
                  ? "You haven't joined any events or events yet. Explore all events to join one or create your own."
                  : "No events exist yet. Create your first event to get started."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-xs"
                >
                  Clear search
                </Button>
              )}
              {viewScope === "joined" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewScope("all")}
                  className="text-xs gap-1.5"
                >
                  <Compass className="size-3.5" />
                  Browse All Events
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Create Event
              </Button>
            </div>
          </Card>
        )}

        {/* Event Cards Grid */}
        {!isLoading && filteredClubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredClubs.map((club) => {
              const startDate = formatDate(club.start_date);
              const endDate = formatDate(club.end_date);
              const isJoined = joinedClubIds.has(club.id);
              const isCreator = club.created_by === user?.id;

              return (
                <Link
                  key={club.id}
                  to={`/clubs/${club.id}`}
                  className="group block relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4.5 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <Badge
                          variant={
                            club.status === "active" ? "success" : "secondary"
                          }
                          className="capitalize text-[10px] px-2 py-0.5"
                        >
                          {club.status}
                        </Badge>

                        {isCreator && (
                          <Badge
                            variant="purple"
                            className="text-[10px] px-2 py-0.5"
                          >
                            Admin
                          </Badge>
                        )}

                        {isJoined && !isCreator && (
                          <Badge
                            variant="info"
                            className="text-[10px] px-2 py-0.5 gap-1"
                          >
                            <UserCheck className="size-3" />
                            Joined
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {club.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isJoined && (
                        <button
                          type="button"
                          disabled={joiningClubId === club.id}
                          onClick={(e) => handleInlineJoin(e, club.id)}
                          className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                        >
                          <LogIn className="size-3" />
                          <span>
                            {joiningClubId === club.id ? "Joining..." : "Join"}
                          </span>
                        </button>
                      )}

                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/40 transition-colors">
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {club.description ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {club.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-3">
                      No description provided
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>
                        {startDate}
                        {endDate ? ` - ${endDate}` : ""}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopyId(e, club.id)}
                      title="Copy Event ID"
                      className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {copiedId === club.id ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span className="text-emerald-600 font-sans font-medium">
                            Copied!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3 text-slate-400" />
                          <span>ID: {club.id.slice(0, 8)}...</span>
                        </>
                      )}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateClubModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClubCreated={handleClubCreated}
      />

      <JoinClubModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClubJoined={handleClubJoined}
      />
    </div>
  );
}
