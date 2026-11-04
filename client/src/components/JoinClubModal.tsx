import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Compass, KeyRound } from "lucide-react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../lib/api";

interface JoinClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClubJoined: (clubId: string) => void;
}

export function JoinClubModal({ isOpen, onClose, onClubJoined }: JoinClubModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ clubId: string }>();

  const onSubmit = async (data: { clubId: string }) => {
    setError(null);
    setIsSubmitting(true);
    const cleanId = data.clubId.trim();
    try {
      await api.clubs.join(cleanId);
      reset();
      onClubJoined(cleanId);
      onClose();
    } catch (err: any) {
      if (err?.message?.includes("already a member")) {
        // If already a member, open it anyway
        reset();
        onClubJoined(cleanId);
        onClose();
        return;
      }
      setError(err?.message || "Failed to join event. Please check the event ID.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join a Event"
      description="Enter the unique Event ID shared by the event organizer."
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="clubId" className="text-xs font-semibold">
            Event ID (UUID)
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="clubId"
              placeholder="e.g. 9564c2ea-c762-408b-a397-782cfb7d0e11"
              className="pl-9 font-mono text-xs sm:text-sm h-10"
              {...register("clubId", {
                required: "Event ID is required",
                pattern: {
                  value: /^[0-9a-fA-F-]{36}$/,
                  message: "Please enter a valid 36-character UUID",
                },
              })}
            />
          </div>
          {errors.clubId && (
            <p className="text-[11px] text-rose-500">{errors.clubId.message}</p>
          )}
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4"
          >
            {isSubmitting ? "Joining..." : "Join Event"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
