import React from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Wallet, LogOut, PlusCircle, Users, Compass, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";

interface NavbarProps {
  onOpenCreateClub?: () => void;
  onOpenJoinClub?: () => void;
}

export function Navbar({ onOpenCreateClub, onOpenJoinClub }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  eChanda
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  App
                </span>
              </div>
            </div>
          </Link>

          {/* User info & quick actions */}
          <div className="flex items-center gap-2">
            {onOpenJoinClub && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenJoinClub}
                className="hidden sm:inline-flex text-xs h-8 gap-1.5 border-slate-200"
              >
                <Compass className="size-3.5" />
                Join Event
              </Button>
            )}

            {onOpenCreateClub && (
              <Button
                size="sm"
                onClick={onOpenCreateClub}
                className="hidden sm:inline-flex text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PlusCircle className="size-3.5" />
                New Event
              </Button>
            )}

            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800 ml-1">
              <Link
                to="/profile"
                className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group"
                title="Manage Profile"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-4" />}
                </div>
                <div className="hidden xs:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {user?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {user?.phone_number}
                  </span>
                </div>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Log out"
                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="size-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-bottom">
        <div className="grid grid-cols-4 h-14 items-center px-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              location.pathname === "/"
                ? "text-emerald-600 font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Wallet className="size-5" />
            <span className="text-[10px]">Events</span>
          </Link>

          {onOpenCreateClub ? (
            <button
              type="button"
              onClick={onOpenCreateClub}
              className="flex flex-col items-center justify-center gap-1 py-1 text-emerald-600 hover:text-emerald-700"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 -mt-3">
                <PlusCircle className="size-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200">New Event</span>
            </button>
          ) : (
            <div />
          )}

          {onOpenJoinClub ? (
            <button
              type="button"
              onClick={onOpenJoinClub}
              className="flex flex-col items-center justify-center gap-1 py-1 text-slate-500 hover:text-slate-900 dark:text-slate-400"
            >
              <Compass className="size-5" />
              <span className="text-[10px]">Join Event</span>
            </button>
          ) : (
            <div />
          )}

          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              location.pathname === "/profile"
                ? "text-emerald-600 font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <UserIcon className="size-5" />
            <span className="text-[10px]">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
