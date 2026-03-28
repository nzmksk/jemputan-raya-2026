import { notFound } from "next/navigation";

// Root URL has no personalized content — always 404.
export default function Home() {
  notFound();
}
