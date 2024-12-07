# Buy token
Program to buy a token at a given price. It also checks if there is funds to buy and refunds transactions if not.

```
.bss
    currentTX_txid
    currentTX_sender
    currentTX_amount
    currentTX_qty
    creator
    currentBalance
    balanceToPay

.data
    tokenId        101010
    tokenPrice     100_0000_0000
    minBalance     2_0000_0000
    end            0
    oops[4] "No balance to buy your tokens   "

.code
setup:
    SYS getCreator, creator
main:
    SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
    BX currentTX_txid == 0, no_more_tx
    SYS getQuantity, currentTX_qty, currentTX_txid, tokenId
    BX currentTX_sender == creator, set_end             # if (currentTX_sender == creator) { end = 1; continue }
    BX currentTX_qty == 0, main                         # if (currentTX_qty == 0) continue;
    SYS getCurrentBalance, currentBalance
    SET balanceToPay, tokenPrice
    MUL balanceToPay, currentTX_qty            # balanceToPay = tokenPrice * currentTX_qty
    SET $, currentBalance
    SUB $, minBalance
    BX balanceToPay > $, refund                # if (balanceToPay > currentBalance - minBalance)
    SYS sendAmount, balanceToPay, currentTX_sender
    BA main
refund:
    SYS sendQuantity, currentTX_qty, tokenId, currentTX_sender
    SYS sendMessage, oops_0, currentTX_sender
    BA main
set_end:
    SET end, 1      # Contract will end
    BA main
no_more_tx:
    BX end == 0, wait_next_activation
    RST             # reset if creator has sent a transaction
wait_next_activation:
    HARA main
```

## Testcases

```js
[
  // Read the complete help at https://github.com/deleterium/SC-Simulator/blob/main/README.md
  {
    "blockheight": 2,
    "sender": "555n",
    "recipient": "999n",
    "amount": "2002_0000_0000n",
    "messageHex": "5653433103010700928a01000000000000e40b540200000000c2eb0b0000000000000000000000004e6f2062616c616e636520746f2062757920796f757220746f6b656e73202020000000000000000000000000000000000000000000000000c50dd4090a0bbf610930d60c0901bf050a0d22bf610cebc60e150f02450f0c110e3103bf240f05cc0f0abed6d80c010acd050abecd160401bec8bf61040100b78200"
  },
    // Expect trade
  { "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n", "tokens": [ { "asset": 101010, "quantity": 1 } ] },
    // Expect trade
  { "blockheight": 6, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n",
    "tokens": [{"asset": 101010, "quantity": 2 }]},
    // Expect refund
  { "blockheight": 8, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n",
    "tokens": [{"asset": 101010, "quantity": 200000 }]},
    // Contract ends
  { "blockheight": 12, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n" }
]
```