// Machine-written by scripts/abi-export.mjs from the forge ContestSource artifact - do not edit.
// Freshness-gated in CI next to forge build (regenerate: node scripts/abi-export.mjs).
export const contestSourceAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "creators",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "BLOCKHASH_HORIZON",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createRound",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct RoundConfig",
        "components": [
          {
            "name": "settleBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "scheduledSettleTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "valueMin",
            "type": "int256",
            "internalType": "int256"
          },
          {
            "name": "valueSpan",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getRoundConfig",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct RoundConfig",
        "components": [
          {
            "name": "settleBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "scheduledSettleTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "valueMin",
            "type": "int256",
            "internalType": "int256"
          },
          {
            "name": "valueSpan",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRoundResult",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct RoundResult",
        "components": [
          {
            "name": "value",
            "type": "int256",
            "internalType": "int256"
          },
          {
            "name": "settledAt",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isRoundCreator",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "roundCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "settle",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "stateOf",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum RoundState"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "voidRound",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "RoundCreated",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "config",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct RoundConfig",
        "components": [
          {
            "name": "settleBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "scheduledSettleTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "valueMin",
            "type": "int256",
            "internalType": "int256"
          },
          {
            "name": "valueSpan",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoundSettled",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "value",
        "type": "int256",
        "indexed": false,
        "internalType": "int256"
      },
      {
        "name": "occurredAt",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RoundVoided",
    "inputs": [
      {
        "name": "roundId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "EmptyValueSpan",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCreatorSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRoundCreator",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoundNotSettleable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoundNotSettled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RoundNotVoidable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ScheduledTimeNotFuture",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SettleBlockNotFuture",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SettleBlockNotMined",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SettleHorizonLapsed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownRound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ValueSpanOverflow",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VoidBeforeHorizon",
    "inputs": []
  }
] as const;
