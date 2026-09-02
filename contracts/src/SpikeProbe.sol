// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Day-1 spike gate 6: a trivial contract deployed to CC3 testnet to confirm the evm_version
/// that verifies on creditcoin-testnet.blockscout.com. Kept in-tree as the deploy evidence
/// artifact; it holds no product logic and no privileged power.
contract SpikeProbe {
    event Probed(address indexed by, uint256 value);

    uint256 public lastValue;

    function probe(uint256 value) external {
        lastValue = value;
        emit Probed(msg.sender, value);
    }
}
