"use client";

import PerpsPage from "@/components/PerpsPage";
import { useApp } from "../layout";

export default function PerpsRoute() {
  const { prices, setPrices } = useApp();
  return (
    <div className="animate-fadeIn">
      <PerpsPage prices={prices} onPricesUpdate={setPrices} />
    </div>
  );
}
