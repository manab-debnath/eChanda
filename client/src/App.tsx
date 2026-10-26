import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/AuthPage";
import { ClubsListPage } from "./pages/ClubsListPage";
import { ClubDetailsPage } from "./pages/ClubDetailsPage";
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
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
