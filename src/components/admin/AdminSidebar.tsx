import { Building2, CalendarCheck, Mail, MapPin, LogOut, Users, GraduationCap, DoorOpen, ListPlus, UserCog, CreditCard, Tag, Quote, QrCode } from "lucide-react";
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
  { title: "Kehadiran", url: "/admin/attendance", icon: QrCode },
  { title: "Kursus", url: "/admin/courses", icon: GraduationCap },
  { title: "Bilik", url: "/admin/rooms", icon: DoorOpen },
  { title: "Add-on Bilik", url: "/admin/addons", icon: ListPlus },
  { title: "Kod Promo", url: "/admin/promo-codes", icon: Tag },
  { title: "Testimoni", url: "/admin/testimonials", icon: Quote },
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
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const showLabels = !collapsed || isMobile;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 [&_[data-sidebar=sidebar]]:bg-slate-900 [&_[data-sidebar=sidebar]]:text-slate-100">
      <SidebarHeader className="px-4 py-4">
        {showLabels && (
          <div>
            <p className="font-display text-xl font-bold text-white">SynchroLab</p>
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
                      size={isMobile ? "lg" : "default"}
                      className="text-slate-200 hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-800 data-[active=true]:text-white"
                    >
                      <NavLink to={item.url} onClick={handleNavClick} className="flex items-center gap-3">
                        <item.icon className={isMobile ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
                        {showLabels && <span className={isMobile ? "text-base font-medium" : ""}>{item.title}</span>}
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
                      size={isMobile ? "lg" : "default"}
                      className="text-slate-200 hover:bg-slate-800 hover:text-white data-[active=true]:bg-slate-800 data-[active=true]:text-white"
                    >
                      <NavLink to={item.url} onClick={handleNavClick} className="flex items-center gap-3">
                        <item.icon className={isMobile ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
                        {showLabels && <span className={isMobile ? "text-base font-medium" : ""}>{item.title}</span>}
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
          size={isMobile ? "default" : "sm"}
          className="w-full justify-start text-slate-200 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
          {showLabels && <span className={isMobile ? "ml-2 text-base font-medium" : "ml-2"}>Log Keluar</span>}
        </Button>
        {showLabels && (
          <p className="px-2 pt-2 text-[10px] leading-tight text-slate-500">
            Powered by Synchronetwork Sdn. Bhd.
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
