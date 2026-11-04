import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router";
import {
  User as UserIcon,
  Phone,
  Lock,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Calendar,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface ProfileDetailsFormData {
  name: string;
}

interface ChangePasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<User | null>(user);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  // Profile details form
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    setValue: setDetailsValue,
    formState: { errors: detailsErrors, isDirty: isDetailsDirty },
  } = useForm<ProfileDetailsFormData>({
    defaultValues: {
      name: user?.name || "",
    },
  });

  // Change password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPasswordValue = watchPassword("new_password");

  // Fetch fresh profile from API
  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const data = await api.profile.getProfile();
      if (data) {
        setProfileData(data);
        setDetailsValue("name", data.name);
        updateUser(data);
      }
    } catch (err: any) {
      console.warn("Could not fetch fresh profile details:", err);
      // Fallback to existing user from AuthContext
      if (user) {
        setProfileData(user);
        setDetailsValue("name", user.name);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update profile details handler
  const onUpdateDetails = async (data: ProfileDetailsFormData) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsUpdatingDetails(true);
    try {
      const res: any = await api.profile.changeUserDetails({
        name: trimmedName,
      });
      const updatedUser: User = res.user || res;
      setProfileData(updatedUser);
      updateUser(updatedUser, res.token);
      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile details");
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  // Change password handler
  const onChangePassword = async (data: ChangePasswordFormData) => {
    if (data.new_password !== data.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (data.current_password === data.new_password) {
      toast.error("New password cannot be the same as your current password");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.profile.changeUserPassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });

      toast.success(
        res?.message || "Password changed successfully! Please log in again.",
      );
      resetPasswordForm();

      // Automatically log out and redirect to login since password change revokes session
      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pb-24 sm:pb-16 min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-950">
      {/* Top Banner & Navigation */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 pt-4 pb-5 px-4 sticky top-14 sm:top-16 z-30 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 h-8"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {/* User Profile Summary Card */}
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardContent className="p-5 sm:p-6 pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              {/* Avatar Initials */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-white dark:ring-slate-800">
                  {profileData?.name ? (
                    profileData.name.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon className="size-8" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full">
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
                    title="Active"
                  />
                </div>
              </div>

              {/* Name & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {profileData?.name || "eChanda User"}
                  </h1>
                  <Badge variant="purple" className="text-[10px] px-2 py-0.5">
                    Member
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="size-3.5 text-slate-400" />
                  <span>{profileData?.phone_number || user?.phone_number}</span>
                </p>

                {profileData?.created_at && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-2">
                    <Calendar className="size-3 text-slate-400" />
                    <span>Joined on {formatDate(profileData.created_at)}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Edit Profile Details */}
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <UserIcon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Personal Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your display name visible across your clubs and
                  collections.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmitDetails(onUpdateDetails)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="profile-name"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="profile-name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-9 h-10 text-sm rounded-xl"
                    {...registerDetails("name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                  />
                </div>
                {detailsErrors.name && (
                  <p className="text-[11px] text-rose-500">
                    {detailsErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="profile-phone"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Phone Number
                  </Label>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="size-3 text-emerald-500" />
                    Verified Login ID
                  </span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="profile-phone"
                    type="tel"
                    disabled
                    value={
                      profileData?.phone_number || user?.phone_number || ""
                    }
                    className="pl-9 h-10 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Your phone number serves as your unique account identifier and
                  cannot be modified.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingDetails}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm h-10 px-5 rounded-xl gap-2 shadow-xs shadow-emerald-600/20"
                >
                  {isUpdatingDetails ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section 2: Change Password */}
        <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <KeyRound className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">
                  Security & Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Ensure your account stays secure by using a strong password.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmitPassword(onChangePassword)}
              className="space-y-4"
            >
              {/* Current Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="current_password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    className="pl-9 pr-10 h-10 text-sm rounded-xl"
                    {...registerPassword("current_password", {
                      required: "Current password is required",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    title={
                      showCurrentPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.current_password && (
                  <p className="text-[11px] text-rose-500">
                    {passwordErrors.current_password.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="new_password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className="pl-9 pr-10 h-10 text-sm rounded-xl"
                    {...registerPassword("new_password", {
                      required: "New password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters long",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <p className="text-[11px] text-rose-500">
                    {passwordErrors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirm_password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    className="pl-9 pr-10 h-10 text-sm rounded-xl"
                    {...registerPassword("confirm_password", {
                      required: "Please confirm your new password",
                      validate: (val) =>
                        val === newPasswordValue || "Passwords do not match",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                    title={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="text-[11px] text-rose-500">
                    {passwordErrors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>
                  For security reasons, changing your password will terminate
                  your current active session and require you to sign in again.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm h-10 px-5 rounded-xl gap-2 shadow-xs shadow-amber-600/20"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="size-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default ProfilePage;
