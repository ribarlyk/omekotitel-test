"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/src/app/contexts/AuthContext";
import { useCart } from "@/src/app/contexts/CartContext";

export interface UseAuthenticateReturns {
  loginLoading: boolean;
  handleLogin: (event: FormEvent<HTMLFormElement>, cfToken?: string) => Promise<boolean>;
  handleRegister: (event: FormEvent<HTMLFormElement>, cfToken?: string) => Promise<boolean>;
  handleLogout: () => Promise<void>;
}

export const useAuthenticate = (): UseAuthenticateReturns => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { logout, setUser } = useAuth();
  const { refreshCart } = useCart();

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      // Update auth state immediately
      logout();
      refreshCart();
      toast.success("Излязохте успешно.");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>, cfToken?: string): Promise<boolean> => {
    try {
      event.preventDefault();
      setLoading(true);

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim().replace(/[<>"'&]/g, "");
      const password = String(formData.get("password") ?? "");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, cfToken }),
      });

      if (response.ok) {
        // Fetch user data and update auth state
        const meResponse = await fetch("/api/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (meResponse.ok) {
          const userData = await meResponse.json();
          setUser(userData);
        }

        // Establish a Magento PHP session in the browser so wishlist works.
        // In production the app is same-origin with Magento — browser requests pass Cloudflare fine.
        // In local dev this silently fails (cross-origin), which is acceptable.
        try {
          const MAGENTO_URL = (process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "").replace("/graphql", "");
          // GET the login page so Magento sets form_key + PHPSESSID cookies in the browser.
          await fetch(`${MAGENTO_URL}/customer/account/login/`, { credentials: "include" });
          const formKey = document.cookie.split("; ").find((c) => c.startsWith("form_key="))?.split("=")[1];
          if (formKey) {
            await fetch(`${MAGENTO_URL}/customer/account/loginPost/`, {
              method: "POST",
              credentials: "include",
              redirect: "manual",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                "login[username]": email,
                "login[password]": password,
                form_key: formKey,
              }).toString(),
            });
          }
        } catch {
          // Silently ignore — auth succeeded, wishlist may not work until same-origin deploy
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>, cfToken?: string): Promise<boolean> => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const sanitize = (v: unknown) => String(v ?? "").trim().replace(/[<>"'&]/g, "");
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const repass = String(formData.get("repass") ?? "");
      const firstname = sanitize(formData.get("name"));
      const lastname = sanitize(formData.get("lastname"));
      const is_subscribed = Boolean(formData.get("is_subscribed"));

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, repass, firstname, lastname, is_subscribed, cfToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Регистрацията не успя.");
        return false;
      }

      // Auto-login after successful registration
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.ok) {
        const meResponse = await fetch("/api/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (meResponse.ok) {
          const userData = await meResponse.json();
          setUser(userData);
        }
        refreshCart();
      }

      toast.success("Регистрацията е успешна!");
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Регистрацията не успя. Опитайте отново.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loginLoading: loading,
    handleLogin,
    handleLogout,
    handleRegister
  };
};
