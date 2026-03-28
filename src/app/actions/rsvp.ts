"use server";

import { submitRSVP, updateRsvp, getRsvp, getGuest } from "@/lib/google-sheets";
export type { RSVPRecord } from "@/lib/google-sheets";

export interface RSVPState {
  success: boolean;
  declined?: boolean;
  error?: string;
}

export async function fetchRsvpAction(token: string) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return getRsvp(token);
}

export async function submitRSVPAction(
  _prev: RSVPState,
  formData: FormData
): Promise<RSVPState> {
  const token = formData.get("token") as string;
  const guestName = (formData.get("guestName") || formData.get("guestNameFallback")) as string;
  const attending = formData.get("attending") === "true";
  const isUpdate = formData.get("isUpdate") === "true";

  if (!token || !guestName) {
    return { success: false, error: "Borang awak tak lengkap lah. 😒" };
  }

  let numPeople = 0;
  if (attending) {
    const numPeopleRaw = formData.get("numPeople") as string;
    numPeople = parseInt(numPeopleRaw, 10);
    if (isNaN(numPeople) || numPeople < 1) {
      return {
        success: false,
        error: "Reti mengira ke tak ni? Minimum 1 orang kalau nak datang. So isi 1 lah. 😤",
      };
    }
  }

  const nric = (formData.get("nric") as string) ?? "";
  const contact = (formData.get("contact") as string) ?? "";
  const plate = (formData.get("plate") as string) ?? "";
  const dietary = formData.getAll("dietary") as string[];
  const dietaryOther = (formData.get("dietaryOther") as string) ?? "";

  try {
    const guest = await getGuest(token);
    if (!guest || guestName.trim().toLowerCase() !== guest.name.trim().toLowerCase()) {
      return { success: false, error: "Maaf, awak takde dalam senarai jemputan. 😛" };
    }
    if (!isUpdate && guest.hasRsvp) {
      return {
        success: false,
        error: "Awak dah submit lah. Nak submit banyak kali dah kenapa? Pukul kang. ✋🏼",
      };
    }

    const rsvpData = { token, guestName, attending, numPeople, nric, contact, plate, dietary, dietaryOther };
    if (isUpdate) {
      await updateRsvp(token, rsvpData);
    } else {
      await submitRSVP(rsvpData);
    }

    return { success: true, declined: !attending };
  } catch (err) {
    console.error("RSVP submission error:", err);
    return {
      success: false,
      error: "Oops, ada masalah teknikal. Try lagi sekali. Kalau masih tak jadi, awak WhatsApp lah saya. 😅",
    };
  }
}
