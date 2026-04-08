import { NextRequest, NextResponse } from "next/server";
import {
  triggerChallenge,
  triggerVerify,
  triggerDepositCraft,
  triggerCreateOrder,
  triggerCancelOrder,
  triggerOrderHistory,
} from "@/lib/jupiter";
import { isValidAddress, sanitizeError } from "@/lib/validation";

// TODO: Add JWT validation middleware for production to verify tokens server-side
// before forwarding requests to the Jupiter Trigger API.

/**
 * POST /api/trigger
 * Body: { action, ...params }
 *
 * Actions:
 *   challenge  — { wallet }
 *   verify     — { challenge, signature }
 *   deposit    — { jwt, inputMint, amount }
 *   order      — { jwt, ...CreateOrderParams }
 *   cancel     — { jwt, orderId }
 *   history    — { jwt }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, jwt, ...params } = body;

    switch (action) {
      case "challenge": {
        if (!params.wallet) {
          return NextResponse.json({ error: "wallet required" }, { status: 400 });
        }
        if (!isValidAddress(params.wallet)) {
          return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
        }
        const res = await triggerChallenge(params.wallet);
        return NextResponse.json(res);
      }

      case "verify": {
        if (!params.challenge || !params.signature) {
          return NextResponse.json(
            { error: "challenge and signature required" },
            { status: 400 },
          );
        }
        const res = await triggerVerify(params.challenge, params.signature);
        return NextResponse.json(res);
      }

      case "deposit": {
        if (!jwt || !params.inputMint || !params.amount) {
          return NextResponse.json(
            { error: "jwt, inputMint, and amount required" },
            { status: 400 },
          );
        }
        if (!isValidAddress(params.inputMint)) {
          return NextResponse.json({ error: "Invalid inputMint address" }, { status: 400 });
        }
        const res = await triggerDepositCraft(jwt, params.inputMint, params.amount);
        return NextResponse.json(res);
      }

      case "order": {
        if (!jwt || !params.inputMint || !params.outputMint || !params.triggerPrice) {
          return NextResponse.json(
            { error: "jwt and order params required" },
            { status: 400 },
          );
        }
        if (!isValidAddress(params.inputMint)) {
          return NextResponse.json({ error: "Invalid inputMint address" }, { status: 400 });
        }
        if (!isValidAddress(params.outputMint)) {
          return NextResponse.json({ error: "Invalid outputMint address" }, { status: 400 });
        }
        const res = await triggerCreateOrder(jwt, params);
        return NextResponse.json(res);
      }

      case "cancel": {
        if (!jwt || !params.orderId) {
          return NextResponse.json(
            { error: "jwt and orderId required" },
            { status: 400 },
          );
        }
        await triggerCancelOrder(jwt, params.orderId);
        return NextResponse.json({ success: true });
      }

      case "history": {
        if (!jwt) {
          return NextResponse.json({ error: "jwt required" }, { status: 400 });
        }
        const res = await triggerOrderHistory(jwt);
        return NextResponse.json(res);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: challenge, verify, deposit, order, cancel, history" },
          { status: 400 },
        );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
