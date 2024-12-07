# Swap Tokens
Contract to swap 1 TMG token to 1 DASC token.
If the DASC contract already issued a token, adjust it so it does not issue again with this program.

```
.data
    niceMessage[4] "Thank you supporting DASC!      "
    tokenName      "DASC"
    TMGid          11121314
    zero           0

.bss
    currentTX_txid
    currentTX_sender
    currentTX_amount
    currentTX_qty
    creator
    tokenId

.code

entry:
    SYS getCreator, creator
    SYS issueAsset, tokenId, tokenName, zero, zero 

main:
    SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
    BX  currentTX_txid != 0, if_A_end
        HARA main
    if_A_end:
    BX  currentTX_sender != creator, if_B_end
        RST
    if_B_end:
    SYS getQuantity, currentTX_qty, currentTX_txid, TMGid
    BX  currentTX_qty == 0, main
    CALL fn_swapTokens
    BA  main


# ********
# Swap tokens function

.code
fn_swapTokens:
    SYS mintAsset, currentTX_qty, tokenId
    SYS sendQuantity, currentTX_qty, tokenId, currentTX_sender
    SYS sendQuantity, currentTX_qty, TMGid, zero
    SYS sendMessage, niceMessage_0, currentTX_sender
    RET
```

## Testcases

```js
[
  // Read the complete help at https://github.com/deleterium/SC-Simulator/blob/main/README.md
  {
    // Yes, comments are allowed! Here sending a text message.
    "blockheight": 2,
    "sender": "555n",
    "recipient": "999n",
    "amount": "172_0000_0000n",
    "messageHex": "56534331020206005468616e6b20796f7520737570706f7274696e672044415343212020202020204441534300000000a2b2a900000000000000000000000000c50cde0d050707d408090abf710803b78700bf15090c0100d60b0806bf610be7b5a500bee2d20b0dd80b0d09d80b0607cd0109b0"
  },
  {
    // Swap 1
    "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n",
    "tokens": [{ "asset": 11121314, "quantity": 1 }]
  },
  {
    // Swap none (wrong token)
    "blockheight": 6, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n",
    "tokens": [{ "asset": 11111111, "quantity": 1 }]
  },
  {
    // Swap none (no token)
    "blockheight": 8, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Swap many
    "blockheight": 10, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n",
    "tokens": [{ "asset": 11121314, "quantity": 100 }]
  },
  {
    // Contract ends
    "blockheight": 20, "sender": "555", "recipient": "999n", "amount": "2_0000_0000n"
  }
]
```