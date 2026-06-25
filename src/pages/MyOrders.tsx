import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type Order } from "@/lib/api";
import { formatRupiah, orderStatus, orderItemOf, orderItemTypeLabel } from "@/lib/format";

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Order[]>("/orders").then(setOrders).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Pesanan Saya</h1>

          {loading ? (
            <p className="text-muted-foreground text-sm">Memuat...</p>
          ) : orders.length === 0 ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">Belum ada pesanan.</p>
              <Link to="/kelas" className="text-primary font-medium hover:underline">Jelajahi kelas</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const st = orderStatus(o.status);
                const item = orderItemOf(o);
                return (
                  <Link
                    key={o.id}
                    to={`/checkout/${o.id}`}
                    className="flex items-center gap-4 border border-border rounded-lg p-4 hover:border-foreground/30 transition-colors"
                  >
                    <img src={item?.cover_image_url ?? ""} alt="" className="w-20 h-14 object-cover rounded bg-muted" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item?.title ?? "Pesanan"}</p>
                      <p className="text-xs text-muted-foreground">{orderItemTypeLabel(o.item_type)} · {formatRupiah(o.total_idr)}</p>
                    </div>
                    <span className={`text-[10px] tracking-editorial uppercase px-3 py-1 rounded-full whitespace-nowrap ${st.className}`}>{st.label}</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyOrders;
