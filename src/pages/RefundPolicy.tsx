import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import PageHeader from "@/components/PageHeader";

const prose = "text-sm text-muted-foreground leading-relaxed";
const proseStyle = { letterSpacing: "normal", textTransform: "none" } as const;

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <PageHeader kicker="Legal" title="Kebijakan Pengembalian" />

          <section className="glass-panel rounded-2xl p-6 md:p-8 shadow-lg space-y-8">
            <p className={prose} style={proseStyle}>
              Seluruh produk yang dijual di FAZ Academy adalah produk digital (kelas online, e-book, dan tiket
              event). Karena akses diberikan segera setelah pembayaran terverifikasi, berlaku ketentuan pengembalian
              berikut.
            </p>

            <div>
              <h2 className="mb-3">Kebijakan Pengiriman (Delivery Policy)</h2>
              <p className={prose} style={proseStyle}>
                Semua produk FAZ Academy adalah produk digital, sehingga tidak ada proses pengiriman fisik maupun
                biaya ongkos kirim. Akses ke produk (kelas online, e-book, atau tiket event) diberikan secara
                otomatis dan instan begitu pembayaran terverifikasi — untuk transfer bank manual, biasanya dalam
                hitungan menit hingga beberapa jam setelah staf memverifikasi bukti transfer; untuk pembayaran via
                payment gateway, akses diberikan otomatis begitu pembayaran dikonfirmasi oleh sistem.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Kelas Online</h2>
              <p className={prose} style={proseStyle}>
                Pengembalian dana untuk kelas online dapat diajukan dalam waktu 7 hari sejak pembelian, selama kamu
                belum mengakses materi kelas (belum membuka video/lampiran pelajaran apa pun). Setelah materi diakses,
                pembelian dianggap final dan tidak dapat dikembalikan.
              </p>
            </div>

            <div>
              <h2 className="mb-3">E-book</h2>
              <p className={prose} style={proseStyle}>
                Karena file e-book dapat langsung diunduh setelah pembayaran, pembelian e-book bersifat final dan
                tidak dapat dikembalikan, kecuali file yang diterima rusak/tidak dapat dibuka.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Tiket Event</h2>
              <p className={prose} style={proseStyle}>
                Tiket event dapat dibatalkan dengan pengembalian dana penuh apabila pembatalan dilakukan paling
                lambat 3 hari sebelum tanggal acara. Pembatalan setelah batas waktu tersebut tidak dapat dikembalikan.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Kesalahan Pembayaran</h2>
              <p className={prose} style={proseStyle}>
                Jika terjadi pembayaran ganda (double payment) atau kesalahan teknis pada sistem yang menyebabkan
                kamu terbebankan lebih dari seharusnya, kami akan mengembalikan kelebihan pembayaran secara penuh.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Cara Mengajukan Pengembalian</h2>
              <p className={prose} style={proseStyle}>
                Hubungi kami melalui halaman{" "}
                <a href="/kontak" className="text-primary underline underline-offset-2">
                  Kontak
                </a>{" "}
                dengan menyertakan nomor pesanan dan alasan pengembalian. Permintaan akan diproses dalam waktu 3–7
                hari kerja setelah disetujui.
              </p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
