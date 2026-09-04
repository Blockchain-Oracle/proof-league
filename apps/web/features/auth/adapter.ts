"use client";

import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, type Address, type Hex } from "viem";
import { creditCoin3Testnet } from "@proof-league/chain";
import {
  PICK_DOMAIN_NAME,
  PICK_DOMAIN_VERSION,
  PICK_TYPES,
  err,
  ok,
  type PickDomain,
  type PickMessage,
  type Result,
} from "@proof-league/shared";

// THE signing seam (AD-9). Exactly one module in this app turns a drafted Pick into a
// signature, so there is one authority path no matter which surface the player started on.
//
// Two things this deliberately does NOT do. It does not verify anything: the browser's
// idea of who is signed in is not authorization, and intake re-recovers the signer from
// the signature itself. And it does not switch the wallet's chain: an EIP-712 signature is
// computed offline over the domain below, so the chain the wallet happens to be pointed at
// is irrelevant, and asking a player to switch networks to sign a free-points Pick would be
// ceremony with no purpose.
//
// Provider status today. AD-9's product path is a Privy embedded wallet, which is what makes
// FR-1's "no extension, no seed phrase" promise true. That needs an application credential
// this deployment does not have (docs/operations-handoff.md item 5), so it reports itself
// unconfigured by name. An injected EIP-1193 wallet is accepted as a fallback where the
// browser already has one, because it produces the identical signature over the identical
// domain and therefore adds no second authority path. It is labelled as the fallback it is.

const PRIVY_GATE =
  "Sign-in without a wallet extension needs this deployment's Privy application id, which is not set here yet.";

/// Failure kinds this seam can produce, kept separate from anything intake refuses: a
/// declined signature is the player's decision, not a rejected Pick.
export type SigningFailure = "declined" | "unavailable" | "failed";

export type SignPick = (domain: PickDomain, message: PickMessage) => Promise<Result<Hex, SigningFailure>>;

export type SigningProvider =
  | { readonly kind: "loading" }
  | { readonly kind: "unconfigured"; readonly gate: string }
  | { readonly kind: "available"; readonly label: string; readonly connect: () => Promise<void> }
  | { readonly kind: "connected"; readonly label: string; readonly address: Address; readonly signPick: SignPick };

/// The slice of EIP-1193 actually used. Typed locally rather than pulled from a wallet SDK
/// so this file stays the only place that knows a browser wallet can exist at all.
type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

const injectedProvider = (): Eip1193 | undefined => {
  const candidate = (globalThis as { ethereum?: unknown }).ethereum;
  if (candidate === null || typeof candidate !== "object") return undefined;
  return typeof (candidate as Eip1193).request === "function" ? (candidate as Eip1193) : undefined;
};

const INJECTED_LABEL = "browser wallet";

const isAddress = (value: unknown): value is Address =>
  typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);

/// A user closing the wallet prompt is code 4001 in EIP-1193. It is reported as its own
/// kind because "you cancelled" and "the wallet broke" need different copy and different
/// next actions, and collapsing them into one message is how a product blames a player for
/// its own failure.
const failureOf = (error: unknown): SigningFailure =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === 4001
    ? "declined"
    : "failed";

const signWith = (provider: Eip1193, address: Address): SignPick =>
  async (domain, message) => {
    try {
      const wallet = createWalletClient({ account: address, chain: creditCoin3Testnet, transport: custom(provider) });
      // Assembled from the same constants `hashPick` uses, so the digest the wallet signs
      // is the digest the worker and the contract will re-derive. A local copy of these
      // field names would be a second encoding waiting to drift.
      const signature = await wallet.signTypedData({
        domain: {
          name: PICK_DOMAIN_NAME,
          version: PICK_DOMAIN_VERSION,
          chainId: domain.chainId,
          verifyingContract: domain.verifyingContract,
        },
        types: PICK_TYPES,
        primaryType: "Pick",
        message: {
          player: message.player,
          marketId: message.marketId,
          optionIndex: message.optionIndex,
          stake: message.stake,
          nonce: message.nonce,
          utcDay: message.utcDay,
          stakedSoFarInDay: message.stakedSoFarInDay,
        },
      });
      return ok(signature);
    } catch (error) {
      return err(failureOf(error));
    }
  };

export const useSigningProvider = (): SigningProvider => {
  const [address, setAddress] = useState<Address | undefined>(undefined);
  // Starts unknown rather than absent: `window.ethereum` is injected by an extension after
  // hydration on some browsers, and rendering "no wallet here" for a beat and then changing
  // our mind is worse than saying nothing for that beat.
  const [available, setAvailable] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const provider = injectedProvider();
    setAvailable(provider !== undefined);
    if (provider === undefined) return;
    // Only accounts already authorized. This never opens a prompt on page load: a product
    // that asks for a wallet before the player has decided anything is asking too early.
    void provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const first = Array.isArray(accounts) ? accounts[0] : undefined;
        if (isAddress(first)) setAddress(first);
      })
      .catch(() => undefined);
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    const provider = injectedProvider();
    if (provider === undefined) return;
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const first = Array.isArray(accounts) ? accounts[0] : undefined;
      if (isAddress(first)) setAddress(first);
    } catch {
      // A refused connection leaves the provider exactly where it was. The composer keeps
      // the draft and the player can try again.
    }
  }, []);

  if (available === undefined) return { kind: "loading" };
  if (address !== undefined) {
    const provider = injectedProvider();
    if (provider !== undefined) {
      return { kind: "connected", label: INJECTED_LABEL, address, signPick: signWith(provider, address) };
    }
  }
  if (available) return { kind: "available", label: INJECTED_LABEL, connect };
  return { kind: "unconfigured", gate: PRIVY_GATE };
};
