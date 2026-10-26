import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Navbar } from "./Navbar";
import { CreateClubModal } from "./CreateClubModal";
import { JoinClubModal } from "./JoinClubModal";

export function Layout() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Navbar
        onOpenCreateClub={() => setIsCreateOpen(true)}
        onOpenJoinClub={() => setIsJoinOpen(true)}
      />

      <div className="flex-1">
        <Outlet />
      </div>

      <CreateClubModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClubCreated={(newClub) => {
          navigate(`/clubs/${newClub.id}`);
        }}
      />

      <JoinClubModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClubJoined={(clubId) => {
          navigate(`/clubs/${clubId}`);
        }}
      />
    </div>
  );
}
