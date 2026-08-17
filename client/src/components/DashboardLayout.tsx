/**
 * Arabtec Console design reminder:
 * Internal console uses the same paper, ink, signal-red editorial system as the briefing—no generic rounded SaaS sidebar.
 */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { FilePenLine, LogOut, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export type ConsoleNavItem = {
  icon: typeof FilePenLine;
  label: string;
  path: string;
};

type DashboardLayoutProps = {
  children: React.ReactNode;
  navItems: ConsoleNavItem[];
};

export default function DashboardLayout({ children, navItems }: DashboardLayoutProps) {
  const { loading, user, logout } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6 text-ink">
        <div className="max-w-md border-2 border-ink bg-white p-8 shadow-paper">
          <p className="briefing-kicker">Workspace console</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.07em]">Sign in to continue.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Digest review and publication require a Workspace Editor or Admin account.</p>
          <Button onClick={() => startLogin()} className="mt-7 w-full rounded-none bg-signal text-white hover:bg-[#c91627]">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-e-2 border-ink bg-ink text-paper">
        <SidebarHeader className="border-b border-paper/20 px-4 py-5">
          <div className="flex items-center gap-3">
            <img src="/manus-storage/arabtec-angular-mark_3d43127c.png" alt="Arabtec" className="h-8 w-8 object-contain" />
            <div>
              <p className="font-display text-lg font-bold tracking-[-0.06em]">arabtec</p>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-paper/60">workspace console</p>
            </div>
          </div>
        </SidebarHeader>
        <ConsoleNavigation navItems={navItems} />
        <SidebarFooter className="border-t border-paper/20 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 p-2 text-start outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-signal">
                <Avatar className="h-9 w-9 rounded-none border border-paper/30">
                  <AvatarFallback className="rounded-none bg-paper text-xs font-bold text-ink">{user.name?.slice(0, 2).toUpperCase() || "AR"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-sm font-semibold">{user.name || "Workspace user"}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-paper/55"><ShieldCheck size={12} /> {user.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-none">
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="me-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-paper">
        <div className="flex h-14 items-center justify-between border-b-2 border-ink bg-paper px-4 lg:hidden">
          <div className="flex items-center gap-3"><SidebarTrigger className="rounded-none border border-ink" /><span className="font-display font-bold">Console</span></div>
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-signal">{user.role}</span>
        </div>
        <main className="min-h-screen">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ConsoleNavigation({ navItems }: { navItems: ConsoleNavItem[] }) {
  const [location, setLocation] = useLocation();
  return (
    <SidebarContent className="px-2 py-4">
      <p className="px-3 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-paper/45">Manage</p>
      <SidebarMenu className="mt-3 gap-1">
        {navItems.map(item => {
          const active = location === item.path;
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={active}
                onClick={() => setLocation(item.path)}
                className={`h-11 rounded-none text-paper hover:bg-white/10 hover:text-white data-[active=true]:bg-signal data-[active=true]:text-white ${active ? "bg-signal text-white" : ""}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarContent>
  );
}
