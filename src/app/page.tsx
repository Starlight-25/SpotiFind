import { Suspense } from "react";
import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
