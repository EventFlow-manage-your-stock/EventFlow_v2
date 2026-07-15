'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Box, CalendarCheck, CheckCircle2, ChevronRight, LayoutGrid, ShieldCheck, Sparkles, Truck, Users, Zap } from 'lucide-react';

// --- LEKKI KOMPONENT ANIMACJI SCROLLOWANIA ---
function Reveal({ children, delay = 0, direction = 'up' }: { children: React.ReactNode, delay?: number, direction?: 'up' | 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const base = "transition-all duration-1000 ease-out";
  const hidden = {
    up: "opacity-0 translate-y-12",
    left: "opacity-0 translate-x-12",
    right: "opacity-0 -translate-x-12"
  };
  const visible = "opacity-100 translate-y-0 translate-x-0";

  return (
    <div ref={ref} className={`${base} ${isVisible ? visible : hidden[direction]}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/eventflow-mark.svg" alt="EventFlow" className="h-8 w-8" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className="text-xl font-black tracking-tight text-slate-900">Event<span className="text-cyan-600">Flow</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#rozwiazania" className="hover:text-cyan-600 transition-colors">Rozwiązania</a>
            <a href="#funkcje" className="hover:text-cyan-600 transition-colors">Funkcje</a>
            <a href="#bezpieczenstwo" className="hover:text-cyan-600 transition-colors">Bezpieczeństwo</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Zaloguj się</Link>
            <Link href="/login" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-cyan-600 hover:shadow-cyan-600/30 transition-all hover:-translate-y-0.5">
              Rozpocznij darmowy test
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (Dark / Modern) */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#0B1120] text-white">
        {/* Abstract Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-cyan-300 mb-6 backdrop-blur-md">
              <Sparkles size={16} /> Nowość: Inteligentny moduł WZ/PZ już dostępny
            </div>
          </Reveal>
          
          <Reveal delay={100}>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Zapanuj nad chaosem.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Eventy pod pełną kontrolą.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Gdzie jest ten kabel? Kto wziął mikrofon? Przestań tracić pieniądze na zagubionym sprzęcie. EventFlow to jedyny system operacyjny, jakiego potrzebuje Twoja firma eventowa.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-500 text-slate-950 px-8 py-4 rounded-full text-base font-black shadow-[0_0_40px_-10px_rgba(6,182,212,0.6)] hover:bg-cyan-400 hover:scale-105 transition-all">
                Przetestuj system za darmo <ArrowRight size={18} />
              </Link>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 text-white border border-white/10 px-8 py-4 rounded-full text-base font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                Umów prezentację (15 min)
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500 font-semibold">Brak konieczności podawania karty kredytowej. Wdrożenie w 24 godziny.</p>
          </Reveal>
        </div>
      </section>

      {/* SOCIAL PROOF (Logos) */}
      <section className="py-10 border-b border-slate-200 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <p className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-8">System, któremu zaufali liderzy techniki scenicznej</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholdery na logotypy klientów */}
            <span className="text-xl font-black flex items-center gap-2"><div className="w-6 h-6 bg-slate-900 rounded-md rotate-45"></div> STAGE TECH</span>
            <span className="text-xl font-black flex items-center gap-2"><Zap size={24}/> LIGHTING PRO</span>
            <span className="text-xl font-black flex items-center gap-2"><LayoutGrid size={24}/> RENTAL HOUSE</span>
            <span className="text-xl font-black flex items-center gap-2"><div className="w-6 h-6 rounded-full border-4 border-slate-900"></div> SOUND VISION</span>
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES (Apple Style) */}
      <section id="funkcje" className="py-24 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <Reveal>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight text-center mb-16">
              Wszystko, czego potrzebujesz.<br /> W jednym miejscu.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
            {/* Duża karta - Magazyn */}
            <Reveal delay={100} className="md:col-span-2">
              <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-xl shadow-slate-200/50 h-full flex flex-col justify-between group overflow-hidden relative transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-100">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mb-6">
                    <Box size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">Bezbłędny Magazyn.</h3>
                  <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed">
                    Skanuj kody QR, wydawaj sprzęt na eventy, twórz dokumenty WZ/PZ. System sam poinformuje Cię o brakach i opóźnieniach.
                  </p>
                </div>
                <div className="mt-10 -mr-12 -mb-12 relative z-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Mockup wizualny tabeli magazynu */}
                  <div className="bg-slate-50 border border-slate-200 rounded-tl-2xl p-4 shadow-sm">
                    <div className="flex justify-between border-b pb-2 mb-2 text-xs font-bold text-slate-400">
                      <span>SPRZĘT</span> <span>STATUS</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"><span className="font-bold text-sm">Głowica ruchoma 1</span><span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-1 rounded font-black">WYDANY</span></div>
                      <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"><span className="font-bold text-sm">Konsola Audio X3</span><span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black">W MAGAZYNIE</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Mniejsza karta - Kalendarz */}
            <Reveal delay={200}>
              <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl h-full flex flex-col group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/20">
                <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                  <CalendarCheck size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black mb-4">Grafik bez kolizji.</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-8">
                  Planuj wydarzenia, przypisuj ekipy techniczne i rezerwuj pojazdy z wyprzedzeniem. Zapomnij o overbookingu.
                </p>
                <div className="mt-auto space-y-2">
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 w-3/4"></div></div>
                  <div className="h-2 w-3/4 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-orange-400 w-1/2"></div></div>
                </div>
              </div>
            </Reveal>

            {/* Mniejsza karta - Oferty */}
            <Reveal delay={100}>
              <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-3xl p-8 shadow-xl shadow-cyan-600/20 h-full flex flex-col transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-600/40">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black mb-4">Błyskawiczne Oferty.</h3>
                <p className="text-cyan-50 font-medium leading-relaxed">
                  Twórz profesjonalne wyceny w kilka kliknięć. Inteligentny algorytm dopasuje ceny do budżetu klienta, chroniąc Twoją marżę.
                </p>
              </div>
            </Reveal>

            {/* Mniejsza karta - Serwis i Flota */}
            <Reveal delay={200} className="md:col-span-2">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 h-full flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <Truck size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">Flota i Serwis pod nadzorem.</h3>
                <p className="text-lg text-slate-500 font-medium max-w-lg leading-relaxed">
                  Koniec z niespodziewanymi awariami. Śledź usterki sprzętu, terminy ubezpieczeń OC oraz przeglądy samochodów w jednym pulpicie.
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Wymaga serwisu</div>
                  <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Naprawiony</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS (High Contrast) */}
      <section className="py-24 bg-[#0B1120] text-white">
        <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <Reveal direction="right">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-6">Liczby mówią same za siebie.</h2>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                Przejście z arkuszy kalkulacyjnych na dedykowany system klasy WMS & ERP zwraca się średnio po zaledwie dwóch miesiącach użytkowania.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-lg font-bold"><CheckCircle2 className="text-cyan-500"/> Zatrzymanie utraty sprzętu</li>
                <li className="flex items-center gap-3 text-lg font-bold"><CheckCircle2 className="text-cyan-500"/> Szybsze generowanie ofert</li>
                <li className="flex items-center gap-3 text-lg font-bold"><CheckCircle2 className="text-cyan-500"/> Eliminacja overbookingu</li>
              </ul>
            </div>
          </Reveal>
          <Reveal direction="left">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center">
                <div className="text-5xl font-black text-cyan-400 mb-2">90%</div>
                <div className="text-sm font-bold text-slate-400">Krótszy czas załadunku busów</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center mt-12">
                <div className="text-5xl font-black text-blue-400 mb-2">100%</div>
                <div className="text-sm font-bold text-slate-400">Kontroli nad historią sprzętu</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ACCREDITATIONS / SECURITY */}
      <section id="bezpieczenstwo" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1000px] mx-auto px-6 text-center">
          <Reveal>
            <ShieldCheck size={48} className="mx-auto text-cyan-600 mb-6" />
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-6">Bezpieczeństwo na poziomie Enterprise</h2>
            <p className="text-lg text-slate-500 font-medium mb-12">
              Twoja baza klientów, stawki rabatowe i tajemnice handlowe są u nas bezpieczne. Stosujemy izolację danych (Multi-Tenancy) i szyfrowanie używane przez największe instytucje finansowe.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-cyan-600 font-black hover:text-cyan-700 transition-colors">
              Przeczytaj więcej o naszej architekturze bezpieczeństwa <ChevronRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA (Contact/Form Style) */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <Reveal>
            <div className="bg-[#0B1120] rounded-[40px] overflow-hidden flex flex-col md:flex-row items-center shadow-2xl">
              <div className="md:w-1/2 p-12 lg:p-20 text-white">
                <h2 className="text-4xl font-black tracking-tight mb-4">Gotowy na zmianę?</h2>
                <p className="text-slate-400 font-medium mb-10">Zostaw nam swoje dane, a nasz ekspert skontaktuje się z Tobą w ciągu 2 godzin i przygotuje bezpłatną wycenę wdrożenia.</p>
                
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Imię i Nazwisko</label>
                    <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Jan Kowalski" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Email biznesowy</label>
                    <input type="email" className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="jan@twojafirma.pl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Czym jesteś najbardziej zainteresowany?</label>
                    <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors">
                      <option>Zarządzanie magazynem (Kody QR)</option>
                      <option>Zarządzanie ekipą i flotą</option>
                      <option>Ofertowanie i CRM</option>
                      <option>Pełny system WMS + ERP</option>
                    </select>
                  </div>
                  <button className="w-full mt-4 bg-cyan-500 text-slate-950 font-black px-6 py-4 rounded-xl hover:bg-cyan-400 transition-colors">
                    Poproś o kontakt
                  </button>
                  <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-semibold">
                    Klikając przycisk zgadzasz się na przetwarzanie danych osobowych w celu kontaktu. Twoje dane są z nami bezpieczne.
                  </p>
                </form>
              </div>
              
              <div className="md:w-1/2 bg-slate-800 self-stretch relative min-h-[400px]">
                {/* W prawdziwym projekcie można tu podłożyć video/img okładkowe */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/50 to-blue-900/50 mix-blend-overlay z-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 m-8">
                    <p className="text-2xl font-black text-white mb-2">"Wdrożenie zajęło 1 dzień."</p>
                    <p className="text-slate-300 font-medium">Od tego czasu nasze braki magazynowe spadły do zera, a klienci dostają oferty w 5 minut.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/eventflow-mark.svg" alt="EventFlow" className="h-6 w-6" onError={(e) => e.currentTarget.style.display = 'none'} />
              <span className="text-lg font-black tracking-tight text-slate-900">EventFlow</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Stworzone przez eventowców dla eventowców. Upraszczamy zarządzanie technologią sceniczną.</p>
          </div>
          <div>
            <h4 className="font-black text-slate-900 mb-4">Produkt</h4>
            <ul className="space-y-2 text-sm text-slate-500 font-semibold">
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Magazyn i Kody QR</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Oferty i Budżety</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Kalendarz i Harmonogram</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Aplikacja mobilna</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-900 mb-4">Firma</h4>
            <ul className="space-y-2 text-sm text-slate-500 font-semibold">
              <li><a href="#" className="hover:text-cyan-600 transition-colors">O nas</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Cennik</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Kontakt</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Partnerzy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-slate-900 mb-4">Wsparcie</h4>
            <ul className="space-y-2 text-sm text-slate-500 font-semibold">
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Centrum pomocy</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Status systemu</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Polityka prywatności</a></li>
              <li><a href="#" className="hover:text-cyan-600 transition-colors">Regulamin</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 text-center text-sm text-slate-400 font-semibold pt-8 border-t border-slate-100">
          &copy; {new Date().getFullYear()} EventFlow. Wszelkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
}