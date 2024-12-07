
# DASC token
Contract to issue a new token and sell them at a fixed price.

```
.data
    niceMessage[4] "Thank you supporting DASC!      "
    tokenName      "DASC"
    tokenPrice     100_0000_0000
    zero           0
    end            0

.bss
    currentTX_txid
    currentTX_sender
    currentTX_amount
    creator
    tokenId

.code
setup:
    SYS getCreator, creator
    SYS issueAsset, tokenId, tokenName, zero, zero 
main:
    SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
    BX currentTX_txid != 0, if_1_end
    HARA main
if_1_end:
    BX currentTX_sender != creator, if_2_end
    RST
if_2_end:
    call SELL_TOKENS
    BA main


# ********
# Sell tokens function

.bss
    sellTokens_qty
    sellTokens_change
.code
SELL_TOKENS:
    SET sellTokens_qty, currentTX_amount
    DIV sellTokens_qty, tokenPrice
    BX sellTokens_qty == 0, if_3_end
    RET
if_3_end:
    SET $, sellTokens_qty
    MUL $, tokenPrice
    SET sellTokens_change, currentTX_amount
    SUB sellTokens_change, $
    SYS mintAsset, sellTokens_qty, tokenId
    SYS sendQuantity, sellTokens_qty, tokenId, currentTX_sender
    SYS sendAmountAndMessage, sellTokens_change, niceMessage_0, currentTX_sender
    RET
```

## Testcases

```js
[
  // Read the complete help at https://github.com/deleterium/SC-Simulator/blob/main/README.md
  {
    "blockheight": 2,
    "sender": "555n",
    "recipient": "999n",
    "amount": "152_0000_0000n",
    "messageHex": "56534331030106005468616e6b20796f7520737570706f7274696e67204441534321202020202020444153430000000000e40b540200000000000000000000000000000000000000000000000000000000000000000000000000000000000000c50cde0d050707d4090a0bbf710903b78700bf150a0c0100b59d00beea150e0b550e06bf710e01b0110e4106150f0b340fd20e0dd80e0d0ad70f010ab0"
  },
    // Expect trade
  { "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "102_0000_0000n" },
    // Expect trade with change
  { "blockheight": 6, "sender": "666n", "recipient": "999n", "amount": "222_0000_0000n" },
    // Expect no trade (no change)
  { "blockheight": 8, "sender": "666n", "recipient": "999n", "amount": "100_0000_0000n" },
    // Contract ends
  { "blockheight": 12, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n" }
]
```