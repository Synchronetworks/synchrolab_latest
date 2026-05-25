import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Instagram, Linkedin } from "lucide-react";
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
            <div className="mt-4 flex gap-3">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-base hover:bg-accent"
                  aria-label="Social"
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
