"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { submitRSVPAction, fetchRsvpAction, RSVPState } from "@/app/actions/rsvp";
import type { RSVPRecord } from "@/lib/google-sheets";

const DIETARY_OPTIONS = [
  { value: "No Meat", label: "Tak Makan Daging Lembu" },
  { value: "Anti Bribe", label: "Tak Makan Rasuah" },
  { value: "No Spicy", label: "Tak Tahan Pedas" },
  { value: "Vegetarian", label: "Vegetarian" },
  { value: "Vegan", label: "Vegan" },
];

interface Props {
  token: string;
  guestName: string;
  hasRsvp: boolean;
  rsvpAttending: boolean | null;
}

const initialState: RSVPState = { success: false };

export default function RsvpForm({ token, guestName, hasRsvp, rsvpAttending }: Props) {
  const [state, action, pending] = useActionState(
    submitRSVPAction,
    initialState,
  );
  const [step, setStep] = useState<"choice" | "form">("choice");
  const [showOther, setShowOther] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingRsvp, setExistingRsvp] = useState<RSVPRecord | null>(null);
  const [fetchingRsvp, startFetchTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const attendingRef = useRef<HTMLInputElement>(null);

  function handleDecline() {
    if (attendingRef.current) attendingRef.current.value = "false";
    formRef.current?.requestSubmit();
  }

  function handleEditClick() {
    startFetchTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const data = await fetchRsvpAction(token);
      if (data) {
        setExistingRsvp(data);
        setShowOther(data.dietaryOther !== "");
        setStep("form");
        setEditMode(true);
      }
    });
  }

  // ── Post-submission state ──
  if (state.success) {
    const isDeclined = state.declined;
    return (
      <div className="card p-8 text-center glow-green">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest/30 border border-leaf flex items-center justify-center">
          {isDeclined ? (
            <svg
              className="w-8 h-8 text-straw/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-palm"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <h3 className="font-display text-2xl text-straw mb-2">
          {isDeclined ? "Ohhh taknak datang!" : "Jom raya dengan saya!"}
        </h3>
        <p className="text-muted text-sm leading-relaxed">
          {isDeclined
            ? "Taknak datang takpe. Kita cari orang lain yang boleh datang. 😛"
            : "Sudah lama tak berjumpa. Kampung belah mana? Baju raya awak warna apa?"}
        </p>
      </div>
    );
  }

  // ── Already submitted (not editing) ──
  if (hasRsvp && !editMode) {
    return (
      <div className="card p-8 text-center glow-green">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest/30 border border-leaf flex items-center justify-center">
          <svg
            className="w-8 h-8 text-palm"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="font-display text-2xl text-straw mb-2">
          Awak dah isi kan?
        </h3>
        <p className="text-muted text-sm leading-relaxed">
          Buang tabiat ke nak isi banyak kali? Pukul kang. ✋🏼
        </p>
        {rsvpAttending === true && (
          <button
            type="button"
            disabled={fetchingRsvp}
            onClick={handleEditClick}
            className="btn-primary mt-5 text-sm transition-colors disabled:opacity-50"
          >
            {fetchingRsvp ? "Jap cari balik borang..." : "Nak tukar plan 😬"}
          </button>
        )}
      </div>
    );
  }

  // ── Form (fresh or edit mode) ──
  const pre = editMode && existingRsvp ? existingRsvp : null;

  return (
    <div className="card p-6 sm:p-8 glow-green">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-straw">
          {editMode ? "Tukar Plan" : "RSVP"}
        </h2>
        {step === "choice" ? (
          <p className="text-muted text-sm mt-1">Jom raya dengan saya!</p>
        ) : (
          <div className="text-muted text-sm mt-1 space-y-1">
            <p>
              Isi dulu ni awak. Kalau malas isi, kita anggap awak taknak datang
              lah ya 😛
            </p>
            <p>(Kalau dah isi tapi nanti tak datang, siap! 😠😠😠)</p>
          </div>
        )}
      </div>

      <form ref={formRef} action={action}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="guestNameFallback" value={guestName} />
        <input type="hidden" name="isUpdate" value={editMode ? "true" : "false"} />
        <input
          ref={attendingRef}
          type="hidden"
          name="attending"
          defaultValue="true"
        />

        {step === "choice" ? (
          // ── Step 1: choice buttons ──
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="btn-primary sm:flex-1"
              >
                Jom! 🧨
              </button>

              <button
                type="button"
                disabled={pending}
                onClick={handleDecline}
                className="cursor-pointer sm:flex-1 py-2.5 text-sm font-medium rounded-lg border border-red-800/60 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Jap bagitahu bini…" : "Taknak, werkk 😛"}
              </button>
            </div>

            {state.error && (
              <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                {state.error}
              </p>
            )}
          </div>
        ) : (
          // ── Step 2: full form ──
          <div className="space-y-5">
            <div>
              <label className="label">Nama Awak <span className="text-red-400">*</span></label>
              <input
                className="input-field"
                type="text"
                name="guestName"
                defaultValue={pre ? pre.guestName : guestName}
                placeholder="Nama penuh"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="label">Nombor Kad Pengenalan <span className="text-red-400">*</span></label>
              <input
                className="input-field"
                type="text"
                name="nric"
                defaultValue={pre ? pre.nric : undefined}
                placeholder="cth. 901231-14-5678"
                required
                maxLength={20}
              />
            </div>

            <div>
              <label className="label">Nombor Telefon <span className="text-red-400">*</span></label>
              <input
                className="input-field"
                type="tel"
                name="contact"
                defaultValue={pre ? pre.contact : undefined}
                placeholder="cth. 012-3456789"
                required
                maxLength={20}
              />
            </div>

            <div>
              <label className="label">Bilangan Tetamu <span className="text-red-400">*</span></label>
              <input
                className="input-field"
                type="number"
                name="numPeople"
                defaultValue={pre ? pre.numPeople : 1}
                min={1}
                max={20}
                step={1}
                placeholder="Termasuk diri anda"
                required
              />
            </div>

            <div>
              <label className="label">Nombor Plat Kenderaan</label>
              <input
                className="input-field"
                type="text"
                name="plate"
                defaultValue={pre ? pre.plate : undefined}
                placeholder="Kosongkan kalau ketegaq nak parking luar 😎"
                maxLength={15}
              />
            </div>

            <div>
              <label className="label">Diet Pemakanan</label>
              <div className="space-y-2 mt-1">
                {DIETARY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      name="dietary"
                      value={opt.value}
                      defaultChecked={pre ? pre.dietary.includes(opt.value) : false}
                      className="w-4 h-4 rounded border-border accent-palm cursor-pointer"
                    />
                    <span className="text-sm text-cream/80 group-hover:text-cream transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked={showOther}
                    className="w-4 h-4 rounded border-border accent-palm cursor-pointer"
                    onChange={(e) => setShowOther(e.target.checked)}
                  />
                  <span className="text-sm text-cream/80 group-hover:text-cream transition-colors">
                    Lain-lain (sila nyatakan)
                  </span>
                </label>

                {showOther && (
                  <input
                    className="input-field mt-2"
                    type="text"
                    name="dietaryOther"
                    defaultValue={pre ? pre.dietaryOther : undefined}
                    placeholder="Yang cerewet ni yang aku malas layan ni 😪"
                    maxLength={200}
                    autoFocus
                  />
                )}
              </div>
            </div>

            {state.error && (
              <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3">
                {state.error}
              </p>
            )}

            <div className={`pt-2 ${editMode ? "flex flex-col sm:flex-row gap-3" : ""}`}>
              <button
                type="submit"
                disabled={pending}
                className={`btn-primary ${editMode ? "sm:flex-1" : "w-full"}`}
              >
                {pending ? "Jap bagitahu bini…" : editMode ? "Kompom" : "Hantar RSVP"}
              </button>

              {editMode && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleDecline}
                  className="sm:flex-1 cursor-pointer py-2.5 text-sm font-medium rounded-lg border border-red-800/60 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tak Jadi Datang
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
