// Uji cepat kredensial Mayar tanpa perlu order sungguhan di database.
// Membuat satu invoice test Rp 10.000 lalu mencetak link pembayarannya.
//
// Pakai:
//   cd server
//   MAYAR_API_KEY=xxx MAYAR_MODE=sandbox npx tsx scripts/mayar-smoke-test.ts
//
// MAYAR_MODE=sandbox  -> https://api.mayar.club/hl/v1 (butuh akun di web.mayar.club)
// MAYAR_MODE=production -> https://api.mayar.id/hl/v1

const apiKey = process.env.MAYAR_API_KEY;
const mode = process.env.MAYAR_MODE ?? "sandbox";

if (!apiKey) {
  console.error("!! Set MAYAR_API_KEY dulu (lihat komentar di atas file ini)");
  process.exit(1);
}

const baseUrl = mode === "production" ? "https://api.mayar.id/hl/v1" : "https://api.mayar.club/hl/v1";

const body = {
  name: "Test Pembeli",
  email: "test@example.com",
  mobile: "081234567890",
  redirectUrl: "https://fazacademy.id/",
  description: "Smoke test integrasi Mayar",
  expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  items: [{ quantity: 1, rate: 10000, description: "Smoke test" }],
};

const res = await fetch(`${baseUrl}/invoice/create`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log(`-- HTTP ${res.status} (${mode} @ ${baseUrl})`);
try {
  const parsed = JSON.parse(text);
  console.log(JSON.stringify(parsed, null, 2));
  if (res.ok && parsed?.data?.link) {
    console.log(`\n✓ Invoice test berhasil dibuat: ${parsed.data.link}`);
  }
} catch {
  console.log(text);
}
