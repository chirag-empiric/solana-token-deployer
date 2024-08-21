export type PoolProgram = {
  "version": "0.1.0",
  "name": "pool_program",
  "instructions": [
    {
      "name": "initMasterAccount",
      "accounts": [
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createPool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "baseAccount",
          "type": "string"
        },
        {
          "name": "quoteAccount",
          "type": "string"
        },
        {
          "name": "baseTokenAmount",
          "type": "f64"
        },
        {
          "name": "quoteTokenAmount",
          "type": "f64"
        }
      ]
    },
    {
      "name": "getPoolDetails",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAccount",
          "type": "string"
        }
      ],
      "returns": {
        "defined": "PoolData"
      }
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "baseInAccount",
          "type": "string"
        },
        {
          "name": "quoteOutAccount",
          "type": "string"
        },
        {
          "name": "tokenInAmount",
          "type": "f64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "master",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "masterAddress",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "poolDetails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "latestPoolId",
            "type": "u64"
          },
          {
            "name": "baseAccount",
            "type": "publicKey"
          },
          {
            "name": "pools",
            "type": {
              "vec": {
                "defined": "(String,PoolData)"
              }
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PoolData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolId",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "baseAccount",
            "type": "string"
          },
          {
            "name": "quoteAccount",
            "type": "string"
          },
          {
            "name": "baseTokenAmount",
            "type": "f64"
          },
          {
            "name": "quoteTokenAmount",
            "type": "f64"
          },
          {
            "name": "poolConstant",
            "type": "f64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PoolNotFound",
      "msg": "Pool Details not found"
    }
  ]
};

export const IDL: PoolProgram = {
  "version": "0.1.0",
  "name": "pool_program",
  "instructions": [
    {
      "name": "initMasterAccount",
      "accounts": [
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createPool",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "baseAccount",
          "type": "string"
        },
        {
          "name": "quoteAccount",
          "type": "string"
        },
        {
          "name": "baseTokenAmount",
          "type": "f64"
        },
        {
          "name": "quoteTokenAmount",
          "type": "f64"
        }
      ]
    },
    {
      "name": "getPoolDetails",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAccount",
          "type": "string"
        }
      ],
      "returns": {
        "defined": "PoolData"
      }
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "fromAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "toAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "master",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "baseInAccount",
          "type": "string"
        },
        {
          "name": "quoteOutAccount",
          "type": "string"
        },
        {
          "name": "tokenInAmount",
          "type": "f64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "master",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "masterAddress",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "poolDetails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "latestPoolId",
            "type": "u64"
          },
          {
            "name": "baseAccount",
            "type": "publicKey"
          },
          {
            "name": "pools",
            "type": {
              "vec": {
                "defined": "(String,PoolData)"
              }
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PoolData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolId",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "baseAccount",
            "type": "string"
          },
          {
            "name": "quoteAccount",
            "type": "string"
          },
          {
            "name": "baseTokenAmount",
            "type": "f64"
          },
          {
            "name": "quoteTokenAmount",
            "type": "f64"
          },
          {
            "name": "poolConstant",
            "type": "f64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "PoolNotFound",
      "msg": "Pool Details not found"
    }
  ]
};
