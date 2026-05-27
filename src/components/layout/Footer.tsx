import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Instagram, Youtube } from "lucide-react";
import logo from "@/assets/logo-synchronetwork.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
                <img src={logo} alt="SynchroLab" className="h-full w-full object-contain" />
              </div>
              <span className="font-display text-lg font-bold">SynchroLab.my</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Platform tempahan kursus IT dan sewa bilik latihan rasmi oleh Synchronetwork Sdn. Bhd. (1194790-K).
            </p>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Pautan</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/kursus" className="hover:text-accent">Senarai Kursus</Link></li>
              <li><Link to="/sewa-bilik" className="hover:text-accent">Sewa Bilik Latihan</Link></li>
              <li><Link to="/semak-tempahan" className="hover:text-accent">Semak Tempahan</Link></li>
              <li><Link to="/hubungi" className="hover:text-accent">Hubungi Kami</Link></li>
              <li><Link to="/admin" className="hover:text-accent">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Untuk Rakan Kongsi</h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/anjur-kursus" className="hover:text-accent">Anjur Kursus di Tempat Anda</Link></li>
              <li><Link to="/senarai-tempat" className="hover:text-accent">Senaraikan Tempat Latihan</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Hubungi</h4>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>Synchronetwork Sdn. Bhd. (1194790-K)<br />79A, Jalan Nova U5/N, Subang Bestari Sek. U5, 40150 Shah Alam, Selangor</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <a href="mailto:salam@synchronet.com.my" className="hover:text-accent">salam@synchronet.com.my</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <a href="tel:+60105847675" className="hover:text-accent">+60 10-584 7675</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">Ikuti Kami</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { label: "Facebook", href: "https://facebook.com/synchronetwork", Icon: Facebook },
                { label: "Instagram", href: "https://instagram.com/synchronetwork", Icon: Instagram },
                {
                  label: "TikTok",
                  href: "https://tiktok.com/@synchronetwork",
                  Icon: (props: { className?: string }) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />
                    </svg>
                  ),
                },
                { label: "YouTube", href: "https://youtube.com/@synchronetwork", Icon: Youtube },
                {
                  label: "Threads",
                  href: "https://threads.net/@synchronetwork",
                  Icon: (props: { className?: string }) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden="true">
                      <path d="M12.18 22h-.06C8.46 21.98 5.7 20.92 4 18.85 2.5 17 1.72 14.42 1.7 12.01v-.02C1.72 9.58 2.5 7 4 5.15 5.7 3.08 8.46 2.02 12.12 2h.06c2.8.02 5.14.65 6.97 1.87 1.71 1.16 2.92 2.83 3.55 4.97l-2.06.59c-1.07-3.63-3.62-5.5-7.47-5.52-2.97.02-5.22.95-6.55 2.57C5.42 7.97 4.83 9.92 4.82 12s.6 4.03 1.8 5.52c1.33 1.62 3.58 2.55 6.55 2.57 2.68-.02 4.45-.65 5.92-2.11.84-.83 1.6-2.07 1.6-3.43 0-2.4-1.27-3.83-4.05-4.6-.21 1.78-.85 3.21-1.9 4.24-1.2 1.18-2.85 1.78-4.78 1.74-1.46-.03-2.7-.43-3.59-1.16-.97-.79-1.46-1.93-1.4-3.21.13-2.54 2.22-4.11 5.32-4 .94.03 1.84.13 2.66.29-.13-.85-.42-1.52-.84-2-.6-.66-1.52-1-2.74-1.01h-.04c-.9 0-2.13.27-2.9 1.5l-1.78-1.2C7.83 5.51 9.36 4.74 11.4 4.74h.06c3.42.02 5.46 2.13 5.66 5.81.12.05.23.1.34.16 1.59.75 2.75 1.89 3.36 3.29.85 1.96.93 5.15-1.66 7.74C17.34 21.5 15.06 22 12.18 22zm.04-12.04c-.16 0-.32 0-.49.01-2.4.13-3.34 1.34-3.42 2.48-.07 1.47 1.5 2.16 3 2.19 1.38.03 3.2-.51 3.51-3.49-.75-.16-1.62-.27-2.6-.27z" />
                    </svg>
                  ),
                },
              ].map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-base hover:bg-accent"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-primary-foreground/60 md:flex-row">
          <p>© {new Date().getFullYear()} Synchronetwork Sdn. Bhd. (1194790-K). Hak Cipta Terpelihara.</p>
          <p>Dibangunkan dengan ❤ di Malaysia</p>
        </div>
      </div>
    </footer>
  );
};
