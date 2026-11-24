"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export function LogoutButton() {
  const router = useRouter();
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }
  return <button className="button button-ghost button-small" onClick={logout}><LogOut size={14} /> Sign out</button>;
}
