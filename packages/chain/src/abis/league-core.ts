// Machine-written by scripts/abi-export.mjs from the forge LeagueCore artifact - do not edit.
// Freshness-gated in CI next to forge build (regenerate: node scripts/abi-export.mjs).
export const leagueCoreAbi = [
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
    "name": "MAX_MARKETS_PER_SOURCE_KEY",
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
    "name": "MIN_COMMIT_MARGIN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "commitOrdinalOf",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "commitPicks",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "root",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "uri",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "sha256Hash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMarket",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct MarketConfig",
        "components": [
          {
            "name": "sourceChainKey",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "emitter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "eventSignature",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "subjectFilter",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "decoderId",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "payoutN",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "leagueDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "lockTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "sourceWindowOpen",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "voidDeadline",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "determinismHorizon",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "boundaries",
            "type": "int256[]",
            "internalType": "int256[]"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "dailySpentOf",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "utcDay",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
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
    "name": "dayAggregateOf",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "leagueDay",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct LeagueScoring.DayAggregate",
        "components": [
          {
            "name": "picksCount",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "correctCount",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "dayMarketsOf",
    "inputs": [
      {
        "name": "leagueDay",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct LeagueScoring.DayMarkets",
        "components": [
          {
            "name": "created",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "terminal",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "earliestCommitOrdinalOf",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMarketConfig",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct MarketConfig",
        "components": [
          {
            "name": "sourceChainKey",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "emitter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "eventSignature",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "subjectFilter",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "decoderId",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "payoutN",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "leagueDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "lockTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "sourceWindowOpen",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "voidDeadline",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "determinismHorizon",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "boundaries",
            "type": "int256[]",
            "internalType": "int256[]"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMarketsBySourceKey",
    "inputs": [
      {
        "name": "sourceKey",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPickCommitment",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct PickCommitment",
        "components": [
          {
            "name": "root",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "sha256Hash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "committedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "uri",
            "type": "string",
            "internalType": "string"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getResolution",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Resolution",
        "components": [
          {
            "name": "value",
            "type": "int256",
            "internalType": "int256"
          },
          {
            "name": "occurredAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "resolvedAt",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "winningOption",
            "type": "uint8",
            "internalType": "uint8"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashPickLeaf",
    "inputs": [
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "pick",
        "type": "tuple",
        "internalType": "struct Pick",
        "components": [
          {
            "name": "player",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "marketId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "optionIndex",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "stake",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "nonce",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "utcDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "stakedSoFarInDay",
            "type": "uint16",
            "internalType": "uint16"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "isMarketCreator",
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
    "name": "marketCount",
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
    "name": "playedDaysOf",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint32[]",
        "internalType": "uint32[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proofGateway",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "resolve",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "value",
        "type": "int256",
        "internalType": "int256"
      },
      {
        "name": "occurredAt",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "scoreBatch",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "batchStart",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "picks",
        "type": "tuple[]",
        "internalType": "struct Pick[]",
        "components": [
          {
            "name": "player",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "marketId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "optionIndex",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "stake",
            "type": "uint16",
            "internalType": "uint16"
          },
          {
            "name": "nonce",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "utcDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "stakedSoFarInDay",
            "type": "uint16",
            "internalType": "uint16"
          }
        ]
      },
      {
        "name": "proofs",
        "type": "bytes32[][]",
        "internalType": "bytes32[][]"
      },
      {
        "name": "leafCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "treeRoot",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "scoringProgressOf",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "cursor",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "fullyScored",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "seasonPointsOf",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "internalType": "address"
      }
    ],
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
    "name": "sourceKeyOf",
    "inputs": [
      {
        "name": "config",
        "type": "tuple",
        "internalType": "struct MarketConfig",
        "components": [
          {
            "name": "sourceChainKey",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "emitter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "eventSignature",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "subjectFilter",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "decoderId",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "payoutN",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "leagueDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "lockTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "sourceWindowOpen",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "voidDeadline",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "determinismHorizon",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "boundaries",
            "type": "int256[]",
            "internalType": "int256[]"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "stateOf",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum MarketState"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "streakOf",
    "inputs": [
      {
        "name": "player",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "void",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "winningOptionOf",
    "inputs": [
      {
        "name": "value",
        "type": "int256",
        "internalType": "int256"
      },
      {
        "name": "boundaries",
        "type": "int256[]",
        "internalType": "int256[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "event",
    "name": "DayFinalized",
    "inputs": [
      {
        "name": "leagueDay",
        "type": "uint32",
        "indexed": true,
        "internalType": "uint32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MarketCreated",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "sourceKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "config",
        "type": "tuple",
        "indexed": false,
        "internalType": "struct MarketConfig",
        "components": [
          {
            "name": "sourceChainKey",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "emitter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "eventSignature",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "subjectFilter",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "decoderId",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "payoutN",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "leagueDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "lockTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "sourceWindowOpen",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "voidDeadline",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "determinismHorizon",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "boundaries",
            "type": "int256[]",
            "internalType": "int256[]"
          }
        ]
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MarketFullyScored",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MarketResolved",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "sourceKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "value",
        "type": "int256",
        "indexed": false,
        "internalType": "int256"
      },
      {
        "name": "winningOption",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
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
    "name": "MarketVoided",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "sourceKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PickScored",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "leafIndex",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "player",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "optionIndex",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "stake",
        "type": "uint16",
        "indexed": false,
        "internalType": "uint16"
      },
      {
        "name": "utcDay",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "correct",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "pointsAwarded",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PickSkipped",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "leafIndex",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "player",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "reason",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum LeagueScoring.SkipReason"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PicksCommitted",
    "inputs": [
      {
        "name": "marketId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "root",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "uri",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "sha256Hash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BatchBeyondSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BatchShapeMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BornLocked",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BoundaryCountOutOfRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CommitBeforeLock",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CommitWindowClosed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CommitmentOpeningMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCreatorSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidPickProof",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LeafIndexOutOfRange",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LockNotBeforeDeterminismHorizon",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MarketNotCommittable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MarketNotResolvable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MarketNotScorable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MarketNotVoidable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NonContiguousBatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotCommitted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotMarketCreator",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotProofGateway",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotResolved",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PayoutOptionMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SourceKeyFull",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ThinCommitWindow",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownMarket",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnorderedBoundaries",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VoidBeforeDeadline",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VoidClockNotLongest",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongProofLength",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroCommitmentField",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroDecoderId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroLeagueDay",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroSourceField",
    "inputs": []
  }
] as const;
