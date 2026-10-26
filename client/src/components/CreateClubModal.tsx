import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Calendar, Tag, FileText, CheckCircle2 } from "lucide-react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { api } from "../lib/api";
import type { Club, CreateClubPayload } from "../types";

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClubCreated: (club: Club) => void;
}

export function CreateClubModal({ isOpen, onClose, onClubCreated }: CreateClubModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClubPayload>({
    defaultValues: {
      title: "",
      description: "",
      status: "active",
      start_date: todayStr,
      end_date: "",
    },
  });

  const onSubmit = async (data: CreateClubPayload) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: CreateClubPayload = {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        status: data.status || "active",
        start_date: data.start_date || todayStr,
        end_date: data.end_date ? data.end_date : null,
      };

      const newClub = await api.clubs.create(payload);
      reset();
      onClubCreated(newClub);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create club. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Club / Event"
      description="Start an event or club to manage collections & expenses."
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-semibold">
            Club / Event Title *
          </Label>
          <Input
            id="title"
            placeholder="e.g. Durga Puja 2026, Cricket Cup"
            className="text-sm h-10"
            {...register("title", { required: "Title is required" })}
          />
          {errors.title && (
            <p className="text-[11px] text-rose-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold">
            Description
          </Label>
          <Textarea
            id="description"
            rows={2}
            placeholder="Brief details about this club or event..."
            className="text-sm resize-none"
            {...register("description")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start_date" className="text-xs font-semibold">
              Start Date
            </Label>
            <Input
              id="start_date"
              type="date"
              className="text-xs sm:text-sm h-10"
              {...register("start_date")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_date" className="text-xs font-semibold">
              End Date (Optional)
            </Label>
            <Input
              id="end_date"
              type="date"
              className="text-xs sm:text-sm h-10"
              {...register("end_date")}
            />
          </div>
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
            {isSubmitting ? "Creating..." : "Create Club"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
