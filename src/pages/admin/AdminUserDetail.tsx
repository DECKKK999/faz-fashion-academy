import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, ShoppingBag, Wallet, CheckCircle2 } from "lucide-react";
import { api, ApiError, type UserDetail } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { formatRupiah, formatDuration, orderStatus } from "@/lib/format";

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setNotFound(false);
    api
      .get<UserDetail>(`/reports/user/${userId}`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (!active) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return <div className="p-10 max-w-5xl"><p className="text-muted-foreground text-sm">Loading...</p></div>;
  }

  if (notFound || !data) {
    return (
      <div className="p-10 max-w-5xl">
        <Link to="/admin/users" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={14} /> Kembali ke Users
        </Link>
        <div className="border border-border/50 p-12 text-center text-muted-foreground text-sm">User tidak ditemukan.</div>
      </div>
    );
  }

  const stats = [
    { label: "Enrollment", value: data.stats.enrollments_count.toLocaleString("id-ID"), icon: GraduationCap },
    { label: "Total Pesanan", value: data.stats.orders_count.toLocaleString("id-ID"), icon: ShoppingBag },
    { label: "Pesanan Lunas", value: data.stats.paid_orders_count.toLocaleString("id-ID"), icon: CheckCircle2 },
    { label: "Total Belanja", value: formatRupiah(data.stats.total_spent_idr), icon: Wallet },
  ];

  const joined = new Date(data.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="p-10 max-w-5xl">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Kembali ke Users
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0">
          {data.avatar_url ? (
            <img src={data.avatar_url} alt={data.full_name ?? data.email} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl text-muted-foreground">{(data.full_name || data.email).charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Student</p>
          <h1 className="text-3xl truncate">{data.full_name || data.email.split("@")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">{data.email}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {data.roles.length === 0 ? (
              <span className="text-[10px] tracking-editorial uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded-full">student</span>
            ) : (
              data.roles.map((r) => (
                <span key={r} className="text-[10px] tracking-editorial uppercase px-2 py-0.5 bg-foreground/10 text-foreground rounded-full">{r}</span>
              ))
            )}
            <span className="text-[11px] text-muted-foreground">Bergabung {joined}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="border border-border/50 p-5">
            <s.icon size={16} className="text-muted-foreground mb-3" />
            <p className="text-xl mb-1">{s.value}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Enrollments */}
      <section className="mb-10">
        <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-4">Kelas Diikuti</h2>
        {data.enrollments.length === 0 ? (
          <div className="border border-border/50 p-8 text-center text-muted-foreground text-sm">Belum mengikuti kelas.</div>
        ) : (
          <div className="space-y-3">
            {data.enrollments.map((e) => (
              <div key={e.id} className="border border-border/50 p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <Link to={`/kelas/${e.course.slug}`} className="text-foreground hover:underline">{e.course.title}</Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {e.course.instructor_name || "—"}
                      {e.course.duration_minutes ? ` · ${formatDuration(e.course.duration_minutes)}` : ""}
                    </p>
                  </div>
                  {e.completed_at ? (
                    <span className="text-[10px] tracking-editorial uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-600 rounded-full shrink-0">Selesai</span>
                  ) : (
                    <span className="text-[10px] tracking-editorial uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded-full shrink-0">Berjalan</span>
                  )}
                </div>
                <Progress value={e.progress.percent} className="h-2" />
                <p className="text-[11px] text-muted-foreground mt-2">
                  {e.progress.completed_lessons}/{e.progress.total_lessons} pelajaran · {e.progress.percent}%
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section>
        <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-4">Riwayat Pesanan</h2>
        {data.orders.length === 0 ? (
          <div className="border border-border/50 p-8 text-center text-muted-foreground text-sm">Belum ada pesanan.</div>
        ) : (
          <div className="border border-border/50">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
              <div className="col-span-5">Item</div>
              <div className="col-span-3">Total</div>
              <div className="col-span-2">Tanggal</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {data.orders.map((o) => {
              const st = orderStatus(o.status);
              const title = o.course?.title ?? o.ebook?.title ?? o.event?.title ?? "Pesanan";
              const dateStr = new Date(o.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <div key={o.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center text-sm">
                  <div className="col-span-5 min-w-0">
                    <p className="text-foreground truncate">{title}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{o.item_type}</p>
                  </div>
                  <div className="col-span-3">{formatRupiah(o.total_idr)}</div>
                  <div className="col-span-2 text-muted-foreground text-xs">{dateStr}</div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUserDetail;
