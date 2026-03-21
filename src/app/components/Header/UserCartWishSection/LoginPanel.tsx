"use client";

import { useState } from "react";
import Login from "@/src/app/components/auth/Login";
import Register from "@/src/app/components/auth/Register";
import ForgotPassword from "@/src/app/components/auth/ForgotPassword";

type View = "login" | "register" | "forgot-password";

interface Props {
  onSuccess: () => void;
  onViewChange: (view: View) => void;
}

export const LoginPanel = ({ onSuccess, onViewChange }: Props) => {
  const [view, setView] = useState<View>("login");

  const switchView = (next: View) => {
    setView(next);
    onViewChange(next);
  };

  if (view === "register") {
    return <Register onLogin={() => switchView("login")} onSuccess={onSuccess} />;
  }

  if (view === "forgot-password") {
    return <ForgotPassword onBack={() => switchView("login")} onSuccess={() => switchView("login")} />;
  }

  return (
    <Login
      onSuccess={onSuccess}
      onRegister={() => switchView("register")}
      onForgotPassword={() => switchView("forgot-password")}
    />
  );
};
