// Lightweight fetch wrapper for the FAZ Academy API.
// All requests go to the same origin under /api (Vite proxies to the Express server in dev).
// Auth is via httpOnly cookie, so we always send credentials.

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || res.statusText || "Permintaan gagal";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData, // browser sets multipart Content-Type with boundary
  });
  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    throw new ApiError((data && data.error) || res.statusText || "Upload gagal", res.status);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload,
};

// Shared types matching the API responses.
export type AppRole = "admin" | "instructor" | "student";

export type AuthUser = { id: string; email: string; email_verified?: boolean };

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
} | null;

export type Session = {
  user: AuthUser;
  profile: Profile;
  roles: AppRole[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  instructor_name: string | null;
  price_idr: number;
  level: string | null;
  category: string | null;
  duration_minutes: number | null;
  rating: number | null;
  reviews_count: number;
  students_count: number;
  is_published: boolean;
  created_at: string;
};

export type Ebook = {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  cover_image_url: string | null;
  file_url?: string | null;
  price_idr: number;
  pages: number | null;
  is_published: boolean;
  position: number;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  date_label: string | null;
  time_label: string | null;
  location: string | null;
  address: string | null;
  price_idr: number;
  is_free: boolean;
  spots: number | null;
  spots_left: number | null;
  speaker: string | null;
  description: string | null;
  highlights: string[];
  cover_image_url: string | null;
  is_published: boolean;
  position: number;
};

export type OrderStatus =
  | "pending"
  | "awaiting_verification"
  | "paid"
  | "rejected"
  | "expired"
  | "cancelled"
  | "processing"
  | "failed";

export type OrderItemType = "course" | "ebook" | "event";

export type OrderCourse = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  level: string | null;
  category: string | null;
  instructor_name: string | null;
};

export type OrderEbook = { id: string; slug: string; title: string; cover_image_url: string | null; category: string | null; author: string | null };
export type OrderEvent = { id: string; slug: string; title: string; cover_image_url: string | null; category: string | null; date_label: string | null; location: string | null };

export type Order = {
  id: string;
  user_id: string;
  item_type: OrderItemType;
  course_id: string | null;
  ebook_id: string | null;
  event_id: string | null;
  base_price_idr: number;
  unique_code: number;
  discount_idr: number;
  total_idr: number;
  status: OrderStatus;
  coupon_id: string | null;
  coupon_code: string | null;
  order_group_id: string | null;
  payment_method?: string | null;
  gateway?: string | null;
  gateway_payment_url?: string | null;
  gateway_status?: string | null;
  proof_url: string | null;
  payer_name: string | null;
  payer_bank: string | null;
  transfer_date: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  expires_at: string;
  created_at: string;
  course?: OrderCourse | null;
  ebook?: OrderEbook | null;
  event?: OrderEvent | null;
  user?: { id: string; email: string; profile: { full_name: string | null } | null };
};

export type PaymentInfo = {
  bank_accounts: { bank: string; account_number: string; account_name: string }[];
  instructions: string[];
};

export type Enrollment = {
  id: string;
  enrolled_at: string;
  completed_at: string | null;
  course: OrderCourse & { duration_minutes: number | null };
};

export type PurchaseState = { enrolled: boolean; order: Order | null };

export type BankAccount = {
  id: string;
  bank: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  position: number;
};

// ===== Course player & progress =====
export type PlayerLesson = { id: string; title: string; position: number; duration_minutes: number | null; is_free_preview: boolean; locked: boolean; completed: boolean; video_url: string | null; content: string | null };
export type PlayerModule = { id: string; title: string; position: number; lessons: PlayerLesson[] };
export type PlayerCourse = {
  course: { id: string; slug: string; title: string; subtitle: string | null; cover_image_url: string | null; instructor_name: string | null };
  modules: PlayerModule[];
  access: { enrolled: boolean; can_manage: boolean };
  total_lessons: number;
  completed_count: number;
  progress_pct: number;
  resume_lesson_id: string | null;
};
export type LessonProgressResult = { lesson_id: string; completed: boolean; completed_at: string | null; progress_pct: number; completed_count: number; total_lessons: number; course_completed: boolean };
export type CourseProgress = { completed_count: number; total_lessons: number; progress_pct: number; completed_at: string | null };

// ===== Certificates =====
export type Certificate = {
  id: string;
  certificate_number: string;
  recipient_name: string;
  course_title: string;
  instructor_name: string | null;
  issued_at: string;
  revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  course?: OrderCourse;
  user?: { id: string; email: string; profile: { full_name: string | null } | null };
};
export type CertificateVerification =
  | { valid: true; revoked: boolean; recipient_name: string; course_title: string; instructor_name: string | null; issued_at: string }
  | { valid: false };

// ===== Reviews =====
export type Review = { id: string; user_id: string; course_id: string; rating: number; body: string | null; created_at: string; reviewer?: { full_name: string | null; avatar_url: string | null } };
export type ReviewAggregate = { average: number | null; count: number; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };
export type CourseReviewsResponse = { reviews: Review[]; aggregate: ReviewAggregate; my_review: Review | null };
export type AdminReview = Review & { course: { id: string; title: string; slug: string }; user: { id: string; email: string; profile: { full_name: string | null } | null } };

// ===== Coupons =====
export type DiscountType = "percentage" | "fixed";
export type Coupon = {
  id: string; code: string; description: string | null; discount_type: DiscountType; discount_value: number;
  course_id: string | null; max_uses: number | null; used_count: number; max_discount_idr: number | null;
  min_purchase_idr: number | null; expires_at: string | null; is_active: boolean; created_at: string;
  course?: { id: string; title: string } | null;
};
export type CouponValidation = { valid: boolean; code: string; discount_idr: number; base_price_idr: number; total_preview_idr: number; reason?: string };

// ===== Digital entitlements (library) =====
export type EbookGrant = { id: string; ebook_id: string; granted_at: string; ebook: { id: string; slug: string; title: string; cover_image_url: string | null; author: string | null } };
export type EventTicket = { id: string; event_id: string; ticket_code: string; status: string; issued_at: string; event: { id: string; slug: string; title: string; cover_image_url: string | null; date_label: string | null; location: string | null } };
export type Library = { ebooks: EbookGrant[]; tickets: EventTicket[] };

// ===== Email / notifications =====
export type EmailLog = { id: string; to_email: string; subject: string; template: string; status: "sent" | "failed"; error: string | null; transport: "dev" | "smtp"; user_id: string | null; order_id: string | null; created_at: string };
export type MailerConfig = { transport: "dev" | "smtp"; smtpConfigured: boolean; from: string };

// ===== Reports / analytics =====
export type ReportSummary = { range: string; revenue_total: number; revenue_in_range: number; paid_orders_count: number; paid_orders_in_range: number; avg_order_value: number; pending_count: number; awaiting_count: number; new_students_in_range: number };
export type RevenueSeries = { bucket: "day" | "month"; points: { period: string; revenue: number; orders: number }[] };
export type TopCourse = { course_id: string; title: string; slug: string; revenue: number; paid_count: number };
export type Conversion = { total_orders: number; by_status: Record<OrderStatus, number>; conversion_rate: number };
export type AdminStats = { courses: number; ebooks: number; events: number; enrollments: number; students: number; orders_pending: number; revenue_total: number; revenue_30d: number; paid_orders_total: number };
export type UserDetail = {
  id: string; email: string; created_at: string; full_name: string | null; avatar_url: string | null; roles: AppRole[];
  stats: { enrollments_count: number; orders_count: number; paid_orders_count: number; total_spent_idr: number };
  enrollments: { id: string; enrolled_at: string; completed_at: string | null; course: OrderCourse & { duration_minutes: number | null }; progress: { completed_lessons: number; total_lessons: number; percent: number } }[];
  orders: Order[];
};

// ===== Storefront: cart & wishlist =====
export type ProductType = OrderItemType;
export type CartItem = { id: string; product_type: ProductType; product_id: string; price_idr: number; title_snapshot: string; cover_snapshot: string | null; slug?: string; stale_price?: boolean };
export type Cart = { id: string; items: CartItem[]; total_idr: number };
export type WishlistItem = { id: string; product_type: ProductType; product_id: string; title: string; price_idr: number; cover_image_url: string | null; slug: string };
export type OrderGroup = { order_group_id: string; orders: Order[]; total_idr: number };
