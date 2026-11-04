import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { ClubsListPage } from "./pages/ClubsListPage";
import { ClubDetailsPage } from "./pages/ClubDetailsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import "./index.css";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Protected routes wrapped in Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<ClubsListPage />} />
              <Route path="/clubs/:clubID" element={<ClubDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3500,
            className: "text-xs sm:text-sm font-medium rounded-xl shadow-lg",
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "10px 16px",
              borderRadius: "0.75rem",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#f43f5e",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
