import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getProjects } from "@/lib/db";
import { ProjectManager } from "@/components/admin/project-manager";
import { LogoutButton } from "@/components/admin/logout-button";
export const dynamic = "force-dynamic";
export const metadata = { title: "Portfolio admin", robots: { index: false, follow: false } };
export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const projects = await getProjects(true);
  return <main className="admin-page"><header className="admin-topbar"><div className="shell admin-topbar-inner"><span className="admin-topbar-title">KATISO / CONTENT MANAGEMENT</span><div style={{display:"flex",alignItems:"center",gap:15}}><span style={{fontSize:11,color:"#777",display:"inline-flex",alignItems:"center",gap:6}}><ShieldCheck size={15} /> Authenticated</span><LogoutButton /></div></div></header><div className="shell admin-main"><ProjectManager initialProjects={projects} /><p style={{fontSize:10,color:"#999",marginTop:25}}>Project data is stored in your configured MongoDB database. Back up the database regularly.</p></div></main>;
}
