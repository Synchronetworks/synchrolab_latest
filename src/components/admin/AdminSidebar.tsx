import { Building2, CalendarCheck, Mail, MapPin, LogOut, Users, GraduationCap, DoorOpen, ListPlus, UserCog, CreditCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { title: "Tempahan", url: "/admin/bookings", icon: CalendarCheck },
  { title: "Kursus", url: "/admin/courses", icon: GraduationCap },
  { title: "Bilik", url: "/admin/rooms", icon: DoorOpen },
  { title: "Add-on Bilik", url: "/admin/addons", icon: ListPlus },
  { title: "Pengguna", url: "/admin/users", icon: Users },
  { title: "Anjur Kursus", url: "/admin/host-requests", icon: Building2 },
  { title: "Senarai Tempat", url: "/admin/venue-listings", icon: MapPin },
  { title: "Hubungi Kami", url: "/admin/contact-messages", icon: Mail },
];

const accountItems = [
  { title: "Pembayaran", url: "/admin/payments", icon: CreditCard },
  { title: "Akaun Saya", url: "/admin/account", icon: UserCog },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 [&_[data-sidebar=sidebar]]:bg-slate-900 [&_[data-sidebar=sidebar]]:text-slate-100">
      <SidebarHeader className="px-4 py-4">
        {!collapsed && (
          <div>
            <p className="font-display text-lg font-bold text-white">SynchroLab</p>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="text-slate-200">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">Pengurusan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-800 data-[active=true]:text-white"
                    >
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">Akaun</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => {
                const active = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="text-slate-300 hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-800 data-[active=true]:text-white"
                    >
                      <NavLink to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Log Keluar</span>}
        </Button>
        {!collapsed && (
          <p className="px-2 pt-2 text-[10px] leading-tight text-slate-500">
            Powered by Synchronetwork Sdn. Bhd.
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
