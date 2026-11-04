import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ShoppingBag, Layers, IndianRupee } from "lucide-react";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../lib/api";
import type { ExpenseItem, CreateExpensePayload } from "../types";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  initialData?: ExpenseItem | null;
  onSaved: (item: ExpenseItem) => void;
}

interface FormValues {
  product_name: string;
  quantity: string;
  amount: number;
}

export function ExpenseModal({
  isOpen,
  onClose,
  clubId,
  initialData,
  onSaved,
}: ExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      product_name: "",
      quantity: "1 unit",
      amount: 100,
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("product_name", initialData.product_name);
      setValue("quantity", initialData.quantity || "1 unit");
      setValue("amount", Number(initialData.amount) || 0);
    } else {
      reset({
        product_name: "",
        quantity: "1 unit",
        amount: 100,
      });
    }
  }, [initialData, isOpen, setValue, reset]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: CreateExpensePayload = {
        product_name: data.product_name.trim(),
        quantity: data.quantity.trim(),
        amount: Number(data.amount),
      };

      let result: ExpenseItem;
      if (isEdit && initialData?.id) {
        result = await api.expenses.update(clubId, initialData.id, payload);
      } else {
        result = await api.expenses.create(clubId, payload);
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Expense" : "Record Expense"}
      description="Track event spending, purchases, or vendor payments."
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="product_name" className="text-xs font-semibold">
            Item / Description *
          </Label>
          <div className="relative">
            <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              id="product_name"
              placeholder="e.g. Tent & Lighting, Sweet boxes, Sound"
              className="pl-9 text-sm h-10"
              {...register("product_name", { required: "Item description is required" })}
            />
          </div>
          {errors.product_name && (
            <p className="text-[11px] text-rose-500">{errors.product_name.message}</p>
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
                placeholder="250"
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
            <Label htmlFor="quantity" className="text-xs font-semibold">
              Quantity / Unit *
            </Label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="quantity"
                placeholder="e.g. 1 set, 5 kg, 2 days"
                className="pl-9 text-sm h-10"
                {...register("quantity", { required: "Quantity is required" })}
              />
            </div>
            {errors.quantity && (
              <p className="text-[11px] text-rose-500">{errors.quantity.message}</p>
            )}
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
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update Expense" : "Record Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
