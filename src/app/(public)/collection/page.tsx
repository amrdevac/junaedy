import { Metadata } from "next";

import CollectionPage from "@/components/collection/CollectionPage";

export const metadata: Metadata = {
  title: "Character Collection - Junaedy",
  description: "Daftar lengkap koleksi Hanzi Anda.",
};

export default function CollectionRoute() {
  return <CollectionPage />;
}
