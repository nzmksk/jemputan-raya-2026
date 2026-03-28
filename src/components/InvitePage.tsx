"use client";

import { useEffect, useRef } from "react";
import Countdown from "./Countdown";
import RsvpForm from "./RsvpForm";

interface Props {
  token: string;
  guestName: string;
  hasRsvp: boolean;
  rsvpAttending: boolean | null;
}

export default function InvitePage({ token, guestName, hasRsvp, rsvpAttending }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/jom-raya.mp3");
    audio.loop = true;
    audioRef.current = audio;

    const tryPlay = () => audio.play().catch(() => {});

    tryPlay();

    // Fallback: play on first user interaction if autoplay was blocked.
    // iOS Safari requires touchstart or click to unlock audio; pointerdown alone is insufficient.
    const unlockEvents = ["touchstart", "click", "pointerdown"] as const;
    const onInteract = () => {
      tryPlay();
      unlockEvents.forEach((e) => window.removeEventListener(e, onInteract));
    };
    unlockEvents.forEach((e) => window.addEventListener(e, onInteract, { once: true }));

    return () => {
      audio.pause();
      unlockEvents.forEach((e) => window.removeEventListener(e, onInteract));
    };
  }, []);

  return (
    <main className="min-h-screen bg-ketupat-pattern">
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
        {/* ── Header ── */}
        <header className="text-center space-y-5">
          <div className="flex items-center justify-center gap-3">
            <div className="divider flex-1" />
            <span className="ornament text-lg select-none">❧</span>
            <div className="divider flex-1" />
          </div>

          <div>
            <div className="text-sm tracking-[0.25em] uppercase text-muted mb-3">
              <p>Dengan sukacita dan rasa syukur,</p>
              <p>kami menjemput</p>
            </div>
            <h1 className="font-misplay text-4xl sm:text-5xl text-gradient-gold leading-tight">
              {guestName}
            </h1>
            <p className="font-display italic text-gold-light/70 text-lg mt-1">berserta keluarga</p>
          </div>

          <div>
            <p className="text-muted text-sm">untuk meraikan bersama kami di</p>
            <h2 className="font-display text-2xl sm:text-3xl text-straw-light mt-1">
              Jamuan Hari Raya
            </h2>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="divider flex-1" />
            <p className="font-display text-xl italic text-gradient-green px-2">
              Selamat Hari Raya Aidilfitri
            </p>
            <div className="divider flex-1" />
          </div>

          <p className="text-gold text-sm font-display italic">
            Maaf Zahir &amp; Batin
          </p>
        </header>

        {/* ── Event Details ── */}
        <section className="card p-6 sm:p-8">
          <p className="label mb-4 text-center">Butiran Acara</p>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-forest/20 border border-forest flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-palm"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
              </div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Tarikh
              </p>
              <p className="text-sm text-cream font-medium">
                5 April 2026 (Ahad)
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-forest/20 border border-forest flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-palm"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Masa
              </p>
              <p className="text-sm text-cream font-medium">
                2:00 - 6:00 petang
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-forest/20 border border-forest flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-palm"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Alamat
              </p>
              <p className="text-sm text-cream font-medium">
                A-17-9, Vega Residensi 1, Cyberjaya
              </p>
            </div>
          </div>
        </section>

        {/* ── Countdown ── */}
        <section className="card p-6 sm:p-8 space-y-4">
          <p className="label text-center">Sila RSVP dalam masa</p>
          <Countdown />
          <div className="divider" />
          <p className="text-center text-xs text-muted tracking-wider uppercase">
            sebelum 2 April 2026, 6 petang
          </p>
        </section>

        {/* ── RSVP ── */}
        <RsvpForm token={token} guestName={guestName} hasRsvp={hasRsvp} rsvpAttending={rsvpAttending} />

        {/* ── Footer ── */}
        <footer className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="divider flex-1" />
            <span className="ornament text-lg select-none">❧</span>
            <div className="divider flex-1" />
          </div>
          <p className="text-muted text-xs tracking-widest uppercase">
            Hari Raya Aidilfitri 1447H
          </p>
        </footer>
      </div>
    </main>
  );
}
