"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
const links = [["Opportunities", "#opportunities"], ["Features", "#features"], ["AI Career Hub", "#career-hub"], ["Resources", "#resources"], ["For Employers", "#employers"]];
export default function PublicNavigation() {
  const [open, setOpen] = useState(false);
  const [dashboard, setDashboard] = useState<string>();
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => {
      if (!data?.success || controller.signal.aborted) return;
      const role = data.user?.role;
      if (role === "student") setDashboard("/dashboard");
      else if (role === "employee") setDashboard("/employee/dashboard");
      else if (role === "admin" || role === "superadmin") setDashboard("/admin/dashboard");
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <header className="public-header">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="public-nav landing-container">
      <Link href="/" className="public-brand" aria-label="Internship Tracker home"><span className="brand-monogram">it.</span><span>Internship<br />Tracker</span></Link>
      <nav aria-label="Main navigation" className="public-desktop-links">{links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <div className="public-account">{dashboard ? <Link className="btn" href={dashboard}>Go to Dashboard</Link> : <><Link className="public-signin" href="/login">Sign In</Link><Link className="btn" href="/register">Get Started <span aria-hidden="true">↗</span></Link></>}</div>
      <button type="button" className="public-menu-toggle icon-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="public-mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    {open && <nav id="public-mobile-menu" aria-label="Mobile navigation" className="public-mobile-links" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}{!dashboard && <Link href="/login">Sign In</Link>}</nav>}
  </header>;
}
