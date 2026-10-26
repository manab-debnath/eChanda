import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IndianRupee, Phone, User as UserIcon, CreditCard, Banknote } from "lucide-react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../lib/api";
import type { CollectionItem, CreateCollectionPayload, PaymentMode } from "../types";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  initialData?: CollectionItem | null;
  onSaved: (item: CollectionItem) => void;
}

interface FormValues {
  donor_name: string;
  phone_number: string;
  amount: number;
  payment_mode: PaymentMode;
}

export function CollectionModal({
  isOpen,
  onClose,
  clubId,
  initialData,
  onSaved,
}: CollectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      donor_name: "",
      phone_number: "",
      amount: 500,
      payment_mode: "cash",
    },
  });

  const selectedPaymentMode = watch("payment_mode");

  useEffect(() => {
    if (initialData) {
      setValue("donor_name", initialData.donor_name);
      setValue("phone_number", initialData.phone_number || "");
      setValue("amount", Number(initialData.amount) || 0);
      setValue("payment_mode", initialData.payment_mode || "cash");
    } else {
      reset({
        donor_name: "",
        phone_number: "",
        amount: 500,
        payment_mode: "cash",
      });
    }
  }, [initialData, isOpen, setValue, reset]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: CreateCollectionPayload = {
        donor_name: data.donor_name.trim(),
        phone_number: data.phone_number?.trim() || undefined,
        amount: Number(data.amount),
        payment_mode: data.payment_mode,
      };

      let result: CollectionItem;
      if (isEdit && initialData?.id) {
        result = await api.collections.update(clubId, initialData.id, payload);
      } else {
        result = await api.collections.create(clubId, payload);
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save collection donation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Donation" : "Add Collection / Chanda"}
      description="Record a new contribution or donation for this event."
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="donor_name" className="text-xs font-semibold">
            Donor Name *
          </Label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="donor_name"
              placeholder="e.g. Subhash Ghosh"
              className="pl-9 text-sm h-10"
              {...register("donor_name", { required: "Donor name is required" })}
            />
          </div>
          {errors.donor_name && (
            <p className="text-[11px] text-rose-500">{errors.donor_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-semibold">
              Amount (₹) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                step="any"
                min="1"
                placeholder="500"
                className="pl-8 text-sm h-10 font-mono font-medium"
                {...register("amount", {
                  required: "Amount is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Amount must be greater than 0" },
                })}
              />
            </div>
            {errors.amount && (
              <p className="text-[11px] text-rose-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone_number" className="text-xs font-semibold">
              Phone (Optional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="phone_number"
                type="tel"
                placeholder="Donor phone"
                className="pl-9 text-sm h-10 font-mono"
                {...register("phone_number")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Payment Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue("payment_mode", "cash")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                selectedPaymentMode === "cash"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold shadow-xs"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Banknote className="size-4 text-emerald-600" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setValue("payment_mode", "online")}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                selectedPaymentMode === "online"
                  ? "bg-sky-50 border-sky-500 text-sky-800 font-semibold shadow-xs"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="size-4 text-sky-600" />
              <span>Online / UPI</span>
            </button>
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
            {isSubmitting ? "Saving..." : isEdit ? "Update Donation" : "Record Donation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
