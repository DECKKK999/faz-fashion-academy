import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index.tsx";
import Kelas from "./pages/Kelas.tsx";
import Ebook from "./pages/Ebook.tsx";
import Tentang from "./pages/Tentang.tsx";
import Daftar from "./pages/Daftar.tsx";
import Masuk from "./pages/Masuk.tsx";
import Event from "./pages/Event.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminCourses from "./pages/admin/AdminCourses.tsx";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kelas" element={<Kelas />} />
            <Route path="/ebook" element={<Ebook />} />
            <Route path="/tentang" element={<Tentang />} />
            <Route path="/event" element={<Event />} />
            <Route path="/daftar" element={<Daftar />} />
            <Route path="/masuk" element={<Masuk />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/:id" element={<AdminCourseEdit />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
