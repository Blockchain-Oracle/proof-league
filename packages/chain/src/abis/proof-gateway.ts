// Machine-written by scripts/abi-export.mjs from the forge ProofGateway artifact - do not edit.
// Freshness-gated in CI next to forge build (regenerate: node scripts/abi-export.mjs).
export const proofGatewayAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "creators",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "registrars",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "season",
        "type": "tuple",
        "internalType": "struct SeasonParams",
        "components": [
          {
            "name": "seasonEnd",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "seasonEndDay",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "escrow",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "acceptedAt",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
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
    "name": "decoderCount",
    "inputs": [],
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
    "name": "decoderOf",
    "inputs": [
      {
        "name": "decoderId",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
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
    "name": "isDecoderRegistrar",
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
    "name": "leagueCore",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract LeagueCore"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerDecoder",
    "inputs": [
      {
        "name": "decoder",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "decoderId",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verify",
    "inputs": [
      {
        "name": "sourceKey",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "height",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "encodedTransaction",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "merkleProof",
        "type": "tuple",
        "internalType": "struct INativeQueryVerifier.MerkleProof",
        "components": [
          {
            "name": "root",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "siblings",
            "type": "tuple[]",
            "internalType": "struct INativeQueryVerifier.MerkleProofEntry[]",
            "components": [
              {
                "name": "hash",
                "type": "bytes32",
                "internalType": "bytes32"
              },
              {
                "name": "isLeft",
                "type": "bool",
                "internalType": "bool"
              }
            ]
          }
        ]
      },
      {
        "name": "continuityProof",
        "type": "tuple",
        "internalType": "struct INativeQueryVerifier.ContinuityProof",
        "components": [
          {
            "name": "lowerEndpointDigest",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "roots",
            "type": "bytes32[]",
            "internalType": "bytes32[]"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "DecoderRegistered",
    "inputs": [
      {
        "name": "decoderId",
        "type": "uint32",
        "indexed": true,
        "internalType": "uint32"
      },
      {
        "name": "decoder",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProofAccepted",
    "inputs": [
      {
        "name": "sourceKey",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "sourceChainKey",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "height",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
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
    "type": "error",
    "name": "CodelessDecoder",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRegistrarSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoResolvableMarket",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotDecoderRegistrar",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProofAlreadyAccepted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SourceEventPreOpen",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SourceTxFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownDecoder",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownSourceKey",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VerifierRejectedProof",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongEmitter",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongEventSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongSubject",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroDecoderAddress",
    "inputs": []
  }
] as const;
