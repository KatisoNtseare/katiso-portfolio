import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <main className="admin-page"><div className="admin-login-wrap"><div className="admin-login-card"><Link href="/" className="brand"><span className="brand-mark">K<span>.</span></span><span className="brand-name">KATISO NTSEARE</span></Link><h1>Portfolio admin</h1><p>Sign in to manage project case studies and publishing status.</p><LoginForm /><div style={{marginTop:22,fontSize:10,color:"#999"}}>This area is private. Public visitors cannot create or edit projects.</div></div></div></main>;
}
