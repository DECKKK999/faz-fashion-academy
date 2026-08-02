import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import PageHeader from "@/components/PageHeader";

const prose = "text-sm text-muted-foreground leading-relaxed";
const proseStyle = { letterSpacing: "normal", textTransform: "none" } as const;

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <PageHeader kicker="Legal" title="Kebijakan Privasi" />

          <section className="glass-panel rounded-2xl p-6 md:p-8 shadow-lg space-y-8">
            <p className={prose} style={proseStyle}>
              Kebijakan ini menjelaskan data apa saja yang FAZ Academy kumpulkan dari pengguna, bagaimana data
              tersebut digunakan, dan hak yang kamu miliki atas datamu.
            </p>

            <div>
              <h2 className="mb-3">Data yang Kami Kumpulkan</h2>
              <p className={prose} style={proseStyle}>
                Saat kamu mendaftar dan menggunakan FAZ Academy, kami mengumpulkan: alamat email dan kata sandi
                (tersimpan terenkripsi), nama lengkap dan foto profil, riwayat pesanan dan pembayaran (termasuk bukti
                transfer yang kamu unggah untuk pembayaran manual), serta data transaksi dari payment gateway apabila
                kamu membayar melalui metode tersebut.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Bagaimana Data Digunakan</h2>
              <p className={prose} style={proseStyle}>
                Data yang kami kumpulkan digunakan untuk memproses pesanan dan pembayaran, memverifikasi bukti
                transfer, memberikan akses ke produk yang kamu beli (kelas online, e-book, atau tiket event), serta
                mengirim notifikasi terkait akun dan pesananmu (konfirmasi pesanan, verifikasi pembayaran, sertifikat
                kelulusan, dan sejenisnya).
              </p>
            </div>

            <div>
              <h2 className="mb-3">Berbagi Data dengan Pihak Ketiga</h2>
              <p className={prose} style={proseStyle}>
                Kami membagikan data secukupnya kepada penyedia payment gateway untuk memproses pembayaran, serta
                penyedia layanan email untuk mengirim notifikasi. Kami tidak menjual atau menyewakan data pribadimu
                kepada pihak ketiga untuk kepentingan pemasaran.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Penyimpanan &amp; Keamanan Data</h2>
              <p className={prose} style={proseStyle}>
                Kata sandi disimpan dalam bentuk terenkripsi (hash), bukan teks biasa. Akses ke data akun dibatasi
                melalui sistem autentikasi, dan hanya staf yang berwenang yang dapat mengakses data pesanan/pembayaran
                untuk keperluan verifikasi.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Cookies &amp; Pelacakan</h2>
              <p className={prose} style={proseStyle}>
                Kami menggunakan cookie untuk menjaga sesi login kamu tetap aktif, serta alat analitik (seperti Meta
                Pixel) untuk memahami penggunaan website dan mengukur efektivitas kampanye promosi.
              </p>
            </div>

            <div>
              <h2 className="mb-3">Hak Kamu</h2>
              <p className={prose} style={proseStyle}>
                Kamu berhak mengakses, memperbarui, atau meminta penghapusan data akunmu. Untuk permintaan terkait
                data pribadi, silakan hubungi kami melalui halaman{" "}
                <a href="/kontak" className="text-primary underline underline-offset-2">
                  Kontak
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="mb-3">Perubahan Kebijakan</h2>
              <p className={prose} style={proseStyle}>
                Kebijakan ini dapat diperbarui dari waktu ke waktu. Perubahan akan berlaku sejak dipublikasikan di
                halaman ini.
              </p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
