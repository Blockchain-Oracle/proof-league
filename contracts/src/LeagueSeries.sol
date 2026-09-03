// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {MarketConfig, MarketState} from "./LeagueTypes.sol";

/// LeagueSeriesSurface — Story 2.11's Market Engine (AD-21): recurring Markets minted
/// from immutable on-chain Series templates, so creation joins settlement as fully
/// automatic and "chosen by nobody" is machine-checkable. An abstract surface LeagueCore
/// inherits (the LeagueSeason pattern): still one deployed address, AD-3 stands.
///
/// Determinism argument, pinned here because the negative tests lean on it: slot K's
/// derived params depend only on (template, K, the instances minted below K inside K's
/// observation window). Slots mint strictly in order, so once K is next the below-K
/// instance set is frozen; instantiation REFUSES to run while any in-window observation
/// is still non-terminal, and terminal states plus Resolution values are permanent — so
/// two callers at ANY two times that both succeed derive byte-identical params, and the
/// caller contributes nothing but gas. The one exception is explicit: an
/// externalSubject Series (Hosted Rounds — the source event's subject is a
/// ContestSource roundId minted sequentially on ANOTHER chain, unknowable here) takes
/// its per-slot subject from a market creator, and ONLY the subject; timing and
/// boundaries still derive from the formula.
abstract contract LeagueSeriesSurface {
    /// Immutable once registered. slotTime(K) = firstSlotTime + K * slotPeriodSec is the
    /// instance's sourceWindowOpen; every other clock hangs off it. anchorOffsets empty
    /// means boundary-STATIC (baseBoundaries verbatim — the Hosted Round shape allowed
    /// to pre-extend through judging); non-empty means ANCHORED: boundaries[i] =
    /// anchor + anchorOffsets[i], the anchor being the newest in-window resolved
    /// instance's decoded value (baseBoundaries when none resolved — first slot, or a
    /// window of voids). Boundary freshness beats pre-creation for anchored Series, so
    /// preCreateLeadSec is the rolling-buffer policy knob (AD-21).
    struct SeriesTemplate {
        uint64 sourceChainKey;
        address emitter;
        bytes32 eventSignature;
        bytes32 subjectFilter; // fixed per-series subject; zero = no narrowing
        bool externalSubject; // Hosted Rounds: creator supplies the per-slot subject
        uint32 decoderId;
        uint8 payoutN;
        uint64 firstSlotTime;
        uint64 slotPeriodSec;
        uint64 lockLeadSec; // lockTime = slotTime - lockLeadSec
        uint64 voidTailSec; // voidDeadline = slotTime + voidTailSec
        uint64 horizonTailSec; // determinismHorizon = slotTime + horizonTailSec
        uint64 preCreateLeadSec; // earliest call for slot K = slotTime - preCreateLeadSec
        uint64 obsLagSec; // observation cutoff for slot K = slotTime - obsLagSec
        uint32 maxInstancesPerDay;
        int256[] baseBoundaries;
        int256[] anchorOffsets;
    }

    struct SeriesInstance {
        uint64 slotIndex;
        uint256 marketId;
    }

    error UnknownSeries();
    error InvalidSeriesTemplate();
    error SeriesSubjectMode();
    error SeriesZeroSubject();
    error SeriesSlotNotDue();
    error SeriesDayCapExceeded();
    error SeriesObservationsNotFinal();

    event SeriesRegistered(uint256 indexed seriesId, SeriesTemplate template);
    event SeriesInstantiated(uint256 indexed seriesId, uint64 indexed slotIndex, uint256 indexed marketId);
    event SeriesSlotSkipped(uint256 indexed seriesId, uint64 indexed slotIndex, uint64 lockTime);

    // Offsets and anchors are clamped inside +/-2^128 so anchor + offset can never
    // reach the int256 overflow panic — every refusal on this surface is a named error
    // (the 2.7 arithmetic-bounding idiom).
    int256 private constant ANCHOR_BOUND = int256(uint256(1) << 128);

    uint256 public seriesCount;
    mapping(uint256 => SeriesTemplate) private _templates;
    mapping(uint256 => SeriesInstance[]) private _seriesInstances;
    mapping(uint256 => uint64) public seriesNextSlot;
    mapping(uint256 => mapping(uint32 => uint32)) public seriesMintedOnDay;

    // -- hooks LeagueCore implements (the surface owns no market storage) -------------
    function _createMarketFromSeries(MarketConfig memory config) internal virtual returns (uint256);
    function _seriesMarketState(uint256 marketId) internal view virtual returns (MarketState);
    function _seriesResolutionValue(uint256 marketId) internal view virtual returns (int256);
    function _requireMarketCreator() internal view virtual;
    function _seriesCommitMargin() internal pure virtual returns (uint64);

    /// Creator-gated like createMarket (AD-21 rejected free registration as proof-budget
    /// DoS); immutable thereafter — no edit or unregister path exists at all.
    function registerSeries(SeriesTemplate calldata template) external returns (uint256 seriesId) {
        _requireMarketCreator();
        if (template.sourceChainKey == 0 || template.emitter == address(0) || template.eventSignature == bytes32(0)) {
            revert InvalidSeriesTemplate();
        }
        if (template.decoderId == 0 || template.maxInstancesPerDay == 0) revert InvalidSeriesTemplate();
        uint256 options = template.baseBoundaries.length + 1;
        if (template.baseBoundaries.length == 0 || uint256(template.payoutN) != options) revert InvalidSeriesTemplate();
        // 2-6 Outcome Options like direct admission — a template no slot could ever
        // mint would be a permanently dead series.
        if (template.baseBoundaries.length > 5) revert InvalidSeriesTemplate();
        _requireAscendingBounded(template.baseBoundaries);
        if (template.anchorOffsets.length != 0) {
            if (template.anchorOffsets.length != template.baseBoundaries.length) revert InvalidSeriesTemplate();
            _requireAscendingBounded(template.anchorOffsets);
            // An anchored Hosted Round is a contradiction: its observations live on
            // another chain's contract, not in prior instances here.
            if (template.externalSubject) revert InvalidSeriesTemplate();
        }
        if (template.externalSubject && template.subjectFilter != bytes32(0)) revert InvalidSeriesTemplate();
        // Cadence sanity: the skip loop walks at most elapsed/period slots, so a floor
        // on the period bounds it; the commit window law is enforced at the template so
        // no slot can ever be born inadmissible.
        if (template.slotPeriodSec < 1 hours) revert InvalidSeriesTemplate();
        if (template.lockLeadSec < _seriesCommitMargin()) revert InvalidSeriesTemplate();
        if (template.preCreateLeadSec <= template.lockLeadSec) revert InvalidSeriesTemplate();
        if (template.voidTailSec == 0) revert InvalidSeriesTemplate();
        // First lock strictly future: guards the slotTime - lockLead underflow AND
        // makes a register-then-instantly-dead series unrepresentable.
        // forge-lint: disable-next-line(block-timestamp)
        if (template.firstSlotTime <= uint256(block.timestamp) + template.lockLeadSec) revert InvalidSeriesTemplate();
        seriesId = ++seriesCount;
        _templates[seriesId] = template;
        emit SeriesRegistered(seriesId, template);
    }

    /// The permissionless engine (AD-21): anyone advances a fixed-subject Series once
    /// the next slot is due. Dead slots (lock already past) are skipped, never minted.
    function instantiateNext(uint256 seriesId) external returns (uint256 marketId) {
        SeriesTemplate storage template = _template(seriesId);
        if (template.externalSubject) revert SeriesSubjectMode();
        return _instantiate(seriesId, template, template.subjectFilter);
    }

    /// The one sanctioned deviation (header note): a creator supplies ONLY the subject
    /// (the pre-created ContestSource roundId topic) — timing and boundaries still
    /// derive from the formula, so a tampered-parameter instantiation stays impossible.
    function instantiateHostedSlot(uint256 seriesId, bytes32 subject) external returns (uint256 marketId) {
        _requireMarketCreator();
        SeriesTemplate storage template = _template(seriesId);
        if (!template.externalSubject) revert SeriesSubjectMode();
        if (subject == bytes32(0)) revert SeriesZeroSubject();
        return _instantiate(seriesId, template, subject);
    }

    function seriesTemplateOf(uint256 seriesId) external view returns (SeriesTemplate memory) {
        return _template(seriesId);
    }

    function seriesInstancesOf(uint256 seriesId) external view returns (SeriesInstance[] memory) {
        _template(seriesId);
        return _seriesInstances[seriesId];
    }

    /// The formula as a public view, recomputable forever: below-K instances are frozen
    /// once K exists and Resolutions are permanent, so `pnpm rebuild` (and anyone) can
    /// re-derive any instance's boundaries and diff them against the stored config.
    function deriveSeriesBoundaries(uint256 seriesId, uint64 slotIndex) public view returns (int256[] memory) {
        SeriesTemplate storage template = _template(seriesId);
        if (template.anchorOffsets.length == 0) return template.baseBoundaries;
        uint64 slotTime = template.firstSlotTime + slotIndex * template.slotPeriodSec;
        uint64 cutoff = slotTime > template.obsLagSec ? slotTime - template.obsLagSec : 0;
        SeriesInstance[] storage instances = _seriesInstances[seriesId];
        // Newest-first: the anchor is the NEWEST in-window resolved instance.
        for (uint256 i = instances.length; i > 0; i--) {
            SeriesInstance storage instance = instances[i - 1];
            if (instance.slotIndex >= slotIndex) continue;
            uint64 instanceSlotTime = template.firstSlotTime + instance.slotIndex * template.slotPeriodSec;
            if (instanceSlotTime > cutoff) continue;
            MarketState state = _seriesMarketState(instance.marketId);
            // Instantiation refused to mint while any in-window observation was live,
            // so on a MINTED slot everything here is terminal; the view keeps the check
            // so pre-mint probes answer honestly.
            if (state != MarketState.Resolved && state != MarketState.Voided) revert SeriesObservationsNotFinal();
            if (state == MarketState.Voided) continue; // no value; look further back
            int256 anchor = _seriesResolutionValue(instance.marketId);
            if (anchor >= ANCHOR_BOUND || anchor <= -ANCHOR_BOUND) break; // absurd anchor: base fallback
            int256[] memory derived = new int256[](template.anchorOffsets.length);
            for (uint256 j = 0; j < derived.length; j++) {
                derived[j] = anchor + template.anchorOffsets[j];
            }
            return derived;
        }
        return template.baseBoundaries;
    }

    function _instantiate(uint256 seriesId, SeriesTemplate storage template, bytes32 subject)
        private
        returns (uint256 marketId)
    {
        uint64 slot = seriesNextSlot[seriesId];
        uint64 slotTime;
        uint64 lockTime;
        // Dead-slot rule (AD-21): a slot whose derived lockTime already passed is
        // skipped, never minted — the loop is bounded by elapsed time / (>= 1h period).
        for (;;) {
            slotTime = template.firstSlotTime + slot * template.slotPeriodSec;
            lockTime = slotTime - template.lockLeadSec;
            // forge-lint: disable-next-line(block-timestamp)
            if (lockTime > block.timestamp) break;
            emit SeriesSlotSkipped(seriesId, slot, lockTime);
            slot++;
        }
        // forge-lint: disable-next-line(block-timestamp)
        if (uint256(block.timestamp) + template.preCreateLeadSec < slotTime) revert SeriesSlotNotDue();
        int256[] memory boundaries = deriveSeriesBoundaries(seriesId, slot);
        // Narrowing is safe until year ~10^7; leagueDay is the AD-16 attribution key.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint32 leagueDay = uint32(slotTime / 1 days);
        if (++seriesMintedOnDay[seriesId][leagueDay] > template.maxInstancesPerDay) revert SeriesDayCapExceeded();
        marketId = _createMarketFromSeries(
            MarketConfig({
                sourceChainKey: template.sourceChainKey,
                emitter: template.emitter,
                eventSignature: template.eventSignature,
                subjectFilter: subject,
                decoderId: template.decoderId,
                payoutN: template.payoutN,
                leagueDay: leagueDay,
                lockTime: lockTime,
                sourceWindowOpen: slotTime,
                voidDeadline: slotTime + template.voidTailSec,
                determinismHorizon: slotTime + template.horizonTailSec,
                boundaries: boundaries
            })
        );
        seriesNextSlot[seriesId] = slot + 1;
        _seriesInstances[seriesId].push(SeriesInstance({slotIndex: slot, marketId: marketId}));
        emit SeriesInstantiated(seriesId, slot, marketId);
    }

    function _template(uint256 seriesId) private view returns (SeriesTemplate storage template) {
        if (seriesId == 0 || seriesId > seriesCount) revert UnknownSeries();
        return _templates[seriesId];
    }

    function _requireAscendingBounded(int256[] calldata values) private pure {
        for (uint256 i = 0; i < values.length; i++) {
            if (values[i] >= ANCHOR_BOUND || values[i] <= -ANCHOR_BOUND) revert InvalidSeriesTemplate();
            if (i > 0 && values[i] <= values[i - 1]) revert InvalidSeriesTemplate();
        }
    }
}
