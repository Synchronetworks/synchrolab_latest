import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index.tsx";
import Courses from "./pages/Courses.tsx";
import CourseDetail from "./pages/CourseDetail.tsx";
import Rooms from "./pages/Rooms.tsx";
import CheckBooking from "./pages/CheckBooking.tsx";
import Contact from "./pages/Contact.tsx";
import HostCourse from "./pages/HostCourse.tsx";
import ListVenue from "./pages/ListVenue.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import HostRequestsAdmin from "./pages/admin/HostRequestsAdmin.tsx";
import VenueListingsAdmin from "./pages/admin/VenueListingsAdmin.tsx";
import ContactMessagesAdmin from "./pages/admin/ContactMessagesAdmin.tsx";
import BookingsAdmin from "./pages/admin/BookingsAdmin.tsx";
import UsersAdmin from "./pages/admin/UsersAdmin.tsx";
import CoursesAdmin from "./pages/admin/CoursesAdmin.tsx";
import RoomsAdmin from "./pages/admin/RoomsAdmin.tsx";
import AddonsAdmin from "./pages/admin/AddonsAdmin.tsx";
import AccountAdmin from "./pages/admin/AccountAdmin.tsx";
import PaymentsAdmin from "./pages/admin/PaymentsAdmin.tsx";
import PromoCodesAdmin from "./pages/admin/PromoCodesAdmin.tsx";
import PaymentReturn from "./pages/PaymentReturn.tsx";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/kursus" element={<Courses />} />
            <Route path="/kursus/:id" element={<CourseDetail />} />
            <Route path="/sewa-bilik" element={<Rooms />} />
            <Route path="/anjur-kursus" element={<HostCourse />} />
            <Route path="/senarai-tempat" element={<ListVenue />} />
            <Route path="/semak-tempahan" element={<CheckBooking />} />
            <Route path="/hubungi" element={<Contact />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bayaran/selesai" element={<PaymentReturn />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/host-requests" replace />} />
            <Route path="host-requests" element={<HostRequestsAdmin />} />
            <Route path="venue-listings" element={<VenueListingsAdmin />} />
            <Route path="contact-messages" element={<ContactMessagesAdmin />} />
            <Route path="bookings" element={<BookingsAdmin />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="courses" element={<CoursesAdmin />} />
            <Route path="rooms" element={<RoomsAdmin />} />
            <Route path="addons" element={<AddonsAdmin />} />
            <Route path="account" element={<AccountAdmin />} />
            <Route path="payments" element={<PaymentsAdmin />} />
            <Route path="promo-codes" element={<PromoCodesAdmin />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
