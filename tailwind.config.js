/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marka Ana Renkleri (Canlı)
        "brand-red": "#E11D48",     // Rose 600 (Ana Aksiyon)
        "brand-blue": "#2563EB",    // Blue 600 (İkincil / Güven)
        "brand-orange": "#F59E0B",  // Amber 500 (Fırsat / Yıldız)
        "brand-dark": "#0F172A",    // Slate 900 (Footer / Koyu Metin)

        // Marka Pastel Tonlar (Arkaplanlar)
        "pastel-red": "#FFF1F2",    // Rose 50
        "pastel-blue": "#EFF6FF",   // Blue 50
        "pastel-orange": "#FFFBEB", // Amber 50
        "pastel-gray": "#F8FAFC",   // Slate 50 (Sayfa Zemini)

        // Legacy / Compatibility (Eski kodlar kırılmasın diye tutuyoruz)
        "ana": "#0F172A",
        "ikincil": "#F1F5F9",
        "vurgu": "#E11D48",
        "acikgri": "#94a3b8",
        "cokacikgri": "#cbd5e1",
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}