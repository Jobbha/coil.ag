"use client";

import { useRouter } from "next/navigation";
import DCAPage from "@/components/DCAPage";
import { useApp } from "../layout";

export default function DCARoute() {
  const { prices, setPrices, handleOrderSubmit } = useApp();
  const router = useRouter();

  return (
    <div className="animate-fadeIn">
      <DCAPage
        prices={prices}
        onPricesUpdate={setPrices}
        onSubmitOrder={handleOrderSubmit}
      />
    </div>
  );
}
