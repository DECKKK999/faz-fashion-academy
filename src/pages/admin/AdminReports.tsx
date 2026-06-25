import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, ShoppingBag, Wallet, Users, Clock, ArrowRight } from "lucide-react";
import {
  api,
  type ReportSummary,
  type RevenueSeries,
  type TopCourse,
  type Conversion,
  type Order,
} from "@/lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { toast } from "@/hooks/use-toast";
import { formatRupiah, orderStatus } from "@/lib/format";

const RANGES = [
  { key: "30d", label: "30 Hari" },
  { key: "90d", label: "90 Hari" },
  { key: "12m", label: "12 Bulan" },
  { key: "all", label: "Semua" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const chartConfig: ChartConfig = {
  revenue: { label: "Pendapatan", color: "hsl(var(--foreground))" },
} satisfies ChartConfig;

const STATUS_ORDER = [
  "paid",
  "awaiting_verification",
  "pending",
  "rejected",
  "expired",
  "cancelled",
  "processing",
  "failed",
] as const;

const formatPeriodLabel = (period: string) => {
  // "YYYY-MM-DD" → "DD/MM" ; "YYYY-MM" → "MM/YYYY"
  const parts = period.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  if (parts.length === 2) return `${parts[1]}/${parts[0]}`;
  return period;
};

const AdminReports = () => {
  const [range, setRange] = useState<RangeKey>("30d");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [series, setSeries] = useState<RevenueSeries | null>(null);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [s, rs, tc, cv, ro] = await Promise.all([
          api.get<ReportSummary>(`/reports/summary?range=${range}`),
          api.get<RevenueSeries>(`/reports/revenue-series?range=${range}`),
          api.get<TopCourse[]>(`/reports/top-courses?range=${range}&limit=5`),
          api.get<Conversion>(`/reports/conversion?range=${range}`),
          api.get<Order[]>(`/reports/recent-orders?limit=8`),
        ]);
        if (!active) return;
        setSummary(s);
        setSeries(rs);
        setTopCourses(tc);
        setConversion(cv);
        setRecent(ro);
      } catch (e) {
        if (active) toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [range]);

  const chartData = useMemo(
    () => (series?.points ?? []).map((p) => ({ ...p, label: formatPeriodLabel(p.period) })),
    [series],
  );

  const maxTopRevenue = useMemo(
    () => Math.max(1, ...topCourses.map((c) => c.revenue)),
    [topCourses],
  );

  const kpis = [
    { label: "Pendapatan (range)", value: formatRupiah(summary?.revenue_in_range ?? 0), icon: TrendingUp },
    { label: "Pesanan Lunas", value: (summary?.paid_orders_in_range ?? 0).toLocaleString("id-ID"), icon: ShoppingBag },
    { label: "Rata-rata Order", value: formatRupiah(summary?.avg_order_value ?? 0), icon: Wallet },
    { label: "Siswa Baru", value: (summary?.new_students_in_range ?? 0).toLocaleString("id-ID"), icon: Users },
  ];

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl">Reports</h1>
          <p className="text-muted-foreground text-sm mt-2">Analitik penjualan, konversi, dan kelas terlaris.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`text-[10px] tracking-editorial uppercase px-4 py-2 border transition-colors ${
                range === r.key
                  ? "bg-foreground/10 border-foreground/30 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <k.icon size={18} className="text-muted-foreground" />
            </div>
            <p className="text-2xl mb-1">{k.value}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-border/50 p-5 flex items-center gap-3">
          <Wallet size={16} className="text-muted-foreground" />
          <div>
            <p className="text-lg leading-tight">{formatRupiah(summary?.revenue_total ?? 0)}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">Total Pendapatan</p>
          </div>
        </div>
        <div className="border border-border/50 p-5 flex items-center gap-3">
          <Clock size={16} className="text-amber-600" />
          <div>
            <p className="text-lg leading-tight">{summary?.awaiting_count ?? 0}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">Menunggu Verifikasi</p>
          </div>
        </div>
        <div className="border border-border/50 p-5 flex items-center gap-3">
          <ShoppingBag size={16} className="text-muted-foreground" />
          <div>
            <p className="text-lg leading-tight">{summary?.pending_count ?? 0}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">Menunggu Bayar</p>
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="border border-border/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground">Pendapatan</h2>
          <span className="text-[11px] text-muted-foreground">{series?.bucket === "month" ? "per bulan" : "per hari"}</span>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada data pendapatan.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
            <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}jt` : v >= 1_000 ? `${v / 1_000}rb` : `${v}`)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {formatRupiah(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="monotone"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill="url(#fillRevenue)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top courses */}
        <div className="border border-border/50 p-6">
          <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-5">Kelas Terlaris</h2>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : topCourses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada penjualan kelas.</p>
          ) : (
            <div className="space-y-4">
              {topCourses.map((c) => (
                <div key={c.course_id}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <p className="text-sm text-foreground truncate">{c.title}</p>
                    <p className="text-sm shrink-0">{formatRupiah(c.revenue)}</p>
                  </div>
                  <div className="h-1.5 bg-secondary overflow-hidden rounded-full">
                    <div
                      className="h-full bg-foreground/70"
                      style={{ width: `${Math.round((c.revenue / maxTopRevenue) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{c.paid_count} pesanan lunas</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion */}
        <div className="border border-border/50 p-6">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground">Konversi</h2>
            <span className="text-sm">
              {conversion?.conversion_rate ?? 0}% <span className="text-muted-foreground text-[11px]">lunas</span>
            </span>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : !conversion || conversion.total_orders === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada pesanan.</p>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11px] text-muted-foreground mb-3">
                {conversion.total_orders.toLocaleString("id-ID")} total pesanan
              </p>
              {STATUS_ORDER.filter((s) => (conversion.by_status[s] ?? 0) > 0).map((s) => {
                const count = conversion.by_status[s] ?? 0;
                const pct = Math.round((count / conversion.total_orders) * 100);
                const st = orderStatus(s);
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 rounded-full shrink-0 ${st.className}`}>
                      {st.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-secondary overflow-hidden rounded-full">
                      <div className="h-full bg-foreground/40" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent paid orders */}
      <div className="border border-border/50">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground">Pesanan Lunas Terbaru</h2>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm p-6">Loading...</p>
        ) : recent.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">Belum ada pesanan lunas.</p>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
              <div className="col-span-5">Item / Pembeli</div>
              <div className="col-span-3">Total</div>
              <div className="col-span-2">Tanggal</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {recent.map((o) => {
              const st = orderStatus(o.status);
              const title = o.course?.title ?? o.ebook?.title ?? o.event?.title ?? "Pesanan";
              const dateStr = o.verified_at
                ? new Date(o.verified_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                : "—";
              return (
                <div key={o.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/50 last:border-0 items-center text-sm">
                  <div className="col-span-5 min-w-0">
                    <p className="text-foreground truncate">{title}</p>
                    {o.user ? (
                      <Link
                        to={`/admin/users/${o.user.id}`}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        {o.user.profile?.full_name || o.user.email}
                        <ArrowRight size={11} />
                      </Link>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">—</p>
                    )}
                  </div>
                  <div className="col-span-3">{formatRupiah(o.total_idr)}</div>
                  <div className="col-span-2 text-muted-foreground text-xs">{dateStr}</div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
