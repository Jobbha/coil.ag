"use client";

import Portfolio from "@/components/Portfolio";
import PositionsPanel from "@/components/PositionsPanel";
import { useApp } from "../layout";

export default function OrdersRoute() {
  const { orders, updateOrder, handleOrderCancel } = useApp();

  return (
    <div className="animate-fadeIn space-y-4">
      <Portfolio orders={orders} />
      <PositionsPanel orders={orders} onUpdateOrder={updateOrder} onCancelOrder={handleOrderCancel} />
    </div>
  );
}
