import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index.tsx";
import Kelas from "./pages/Kelas.tsx";
import CourseDetail from "./pages/CourseDetail.tsx";
import CoursePlayer from "./pages/CoursePlayer.tsx";
import StartCheckout from "./pages/StartCheckout.tsx";
import Checkout from "./pages/Checkout.tsx";
import CartCheckout from "./pages/CartCheckout.tsx";
import Cart from "./pages/Cart.tsx";
import Wishlist from "./pages/Wishlist.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import Tentang from "./pages/Tentang.tsx";
import Daftar from "./pages/Daftar.tsx";
import Masuk from "./pages/Masuk.tsx";
import LupaPassword from "./pages/LupaPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import VerifikasiEmail from "./pages/VerifikasiEmail.tsx";
import Akun from "./pages/Akun.tsx";
import Certificates from "./pages/Certificates.tsx";
import VerifyCertificate from "./pages/VerifyCertificate.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminCourses from "./pages/admin/AdminCourses.tsx";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit.tsx";
import AdminOrders from "./pages/admin/AdminOrders.tsx";
import AdminCoupons from "./pages/admin/AdminCoupons.tsx";
import AdminReviews from "./pages/admin/AdminReviews.tsx";
import AdminCertificates from "./pages/admin/AdminCertificates.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminUserDetail from "./pages/admin/AdminUserDetail.tsx";
import AdminEmailLogs from "./pages/admin/AdminEmailLogs.tsx";
import AdminPaymentGateway from "./pages/admin/AdminPaymentGateway.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Publik */}
                <Route path="/" element={<Index />} />
                <Route path="/kelas" element={<Kelas />} />
                <Route path="/kelas/:slug" element={<CourseDetail />} />
                <Route path="/belajar/:slug" element={<CoursePlayer />} />
                <Route path="/tentang" element={<Tentang />} />
                <Route path="/daftar" element={<Daftar />} />
                <Route path="/masuk" element={<Masuk />} />
                <Route path="/lupa-password" element={<LupaPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verifikasi-email" element={<VerifikasiEmail />} />
                <Route path="/verifikasi/:certificateNumber" element={<VerifyCertificate />} />

                {/* Terproteksi (login) */}
                <Route path="/beli/:courseId" element={<ProtectedRoute><StartCheckout /></ProtectedRoute>} />
                <Route path="/checkout/:orderId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/checkout-group/:groupId" element={<ProtectedRoute><CartCheckout /></ProtectedRoute>} />
                <Route path="/keranjang" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="/pesanan" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/sertifikat" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
                <Route path="/akun" element={<ProtectedRoute><Akun /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="courses/:id" element={<AdminCourseEdit />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="certificates" element={<AdminCertificates />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="users/:userId" element={<AdminUserDetail />} />
                  <Route path="email-logs" element={<AdminEmailLogs />} />
                  <Route path="payment-gateway" element={<AdminPaymentGateway />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
