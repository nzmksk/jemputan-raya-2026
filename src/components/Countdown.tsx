"use client";

import { useEffect, useState } from "react";

const RSVP_DEADLINE = new Date("2026-04-02T18:00:00+08:00");
const RAYA_DATE = new Date("2026-04-05T00:00:00+08:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calcTimeLeft(): TimeLeft {
  const diff = RSVP_DEADLINE.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const LABELS = ["Hari", "Jam", "Minit", "Saat"] as const;

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-3 sm:gap-6">
            <div className="countdown-block min-w-12 sm:min-w-18">
              <span className="countdown-number">--</span>
              <span className="countdown-label">{label}</span>
            </div>
            {i < LABELS.length - 1 && (
              <span className="text-straw/40 font-display text-2xl font-bold mb-4">:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (timeLeft.expired && Date.now() < RAYA_DATE.getTime()) {
    return (
      <p className="text-center text-straw font-display text-xl italic">
        Lambat! Orang dah tutup RSVP dah. Tapi kalau nak datang jugak, awak bagi duit raya dulu kat saya. 😜
      </p>
    );
  } else if (Date.now() >= RAYA_DATE.getTime()) {
    return (
      <p className="text-center text-straw font-display text-xl italic">
        Dah raya lah awak. Insya-Allah jumpa lagi tahun depan okay! 😄
      </p>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: "Hari" },
    { value: timeLeft.hours, label: "Jam" },
    { value: timeLeft.minutes, label: "Minit" },
    { value: timeLeft.seconds, label: "Saat" },
  ];

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-3 sm:gap-6">
          <div className="countdown-block">
            <span className="countdown-number">{pad(block.value)}</span>
            <span className="countdown-label">{block.label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-straw/40 font-display text-2xl font-bold mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
