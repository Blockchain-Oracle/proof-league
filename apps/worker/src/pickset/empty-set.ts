import type { Address, Hex } from "viem";
import { leagueCoreAbi } from "@proof-league/chain";
import {
  buildPickSetDocument,
  EMPTY_PICKSET_ROOT,
  pickSetSha256,
  serializePickSetDocument,
  type PickDomain,
} from "@proof-league/shared";
import type { Cc3Clients } from "../cc3.js";
import { PickSetPublisher } from "./publish.js";

// The canonical zero-pick commitment, published for real (AD-5/AD-14). The verify:*
// scripts that drive the LIVE deployment use this rather than committing a placeholder
// uri: every Market on the live core must be reconstructable by `pnpm rebuild`, and a
// commitment pointing at bytes nobody published is exactly the row that gate exists to
// catch. Learned the hard way — the first live settlement run committed a `local:` uri
// and turned the flagship gate red on the flagship deployment.

export type CommittedEmptySet = { readonly uri: string; readonly sha: Hex; readonly root: Hex };

export const commitEmptyPickSet = async (
  clients: Cc3Clients,
  core: Address,
  marketId: bigint,
  publisher: PickSetPublisher,
): Promise<CommittedEmptySet> => {
  const domain: PickDomain = { chainId: clients.publicClient.chain.id, verifyingContract: core };
  const serialized = serializePickSetDocument(buildPickSetDocument(domain, marketId, []));
  const sha = pickSetSha256(serialized);
  // Both homes, then proof-of-readability, then the commit — the same ordering law the
  // production commit round obeys, because this IS that path.
  const published = await publisher.publish(marketId, serialized, sha);
  const hash = await clients.walletClient.writeContract({
    address: core,
    abi: leagueCoreAbi,
    functionName: "commitPicks",
    args: [marketId, EMPTY_PICKSET_ROOT, published.uri, sha],
  });
  await clients.publicClient.waitForTransactionReceipt({ hash });
  return { uri: published.uri, sha, root: EMPTY_PICKSET_ROOT };
};
