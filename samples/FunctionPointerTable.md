# Function pointer table
In this example an array will be populated with the addresses of functions. The creator can send a message to switch the running function.

## Assembly contract

```
.bss
  currentTX_txid
  currentTX_sender
  currentTX_amount
  currentTX_message[4]
  creator
  functionTable[4]
  temp

.data
  nZero 0
  nOne  1
  currentMode 2
  thankYou[4] "You're a great soul!"
  tokenId 112233

.code

setup:
  SET16 functionTable_0, &END
  SET16 functionTable_1, &SEND_HALF
  SET16 functionTable_2, &SEND_MESSAGE
  SET16 functionTable_3, &SEND_TOKEN

  SYS getCreator, creator

messageLoop:
  SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
  BX currentTX_txid != 0, _if37_endif
    HARA messageLoop
  _if37_endif:
  SYS readMessage,  currentTX_txid, nZero, currentTX_message_0
  BX currentTX_sender != creator, regularTransaction
    SET currentMode, currentTX_message_0
    BA messageLoop
  regularTransaction:
  SET temp, &functionTable_0
  ADD temp, currentMode
  SET $, *temp
  JMPR

END:
  RST

SEND_HALF:
  SYS getCurrentBalance, temp
  DIV temp, 2
  SYS sendAmount, temp, currentTX_sender
  BA messageLoop

SEND_MESSAGE:
  SYS sendMessage, thankYou_0, currentTX_sender
  BA messageLoop

SEND_TOKEN:
  SYS sendQuantity, nOne, tokenId, currentTX_sender
  BA messageLoop
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
    "amount": "102_0000_0000n",
    "messageHex": "5653433103030900000000000000000001000000000000000200000000000000596f75277265206120677265617420736f756c2100000000000000000000000069b6010000000000000000000000000000000000000000000000000000000000f911f400f912f500f913ff00f9140401c510d4090a0bbf710903b7d200d509010cbf150a100515030cbee71615112515031315b100c615561502cc150abed3cd040abeced802080abec8"
  },
  {
    // Get message
    "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Set Mode to 1
    "blockheight": 6, "sender": "555", "recipient": "999n", "amount": "2_0000_0000n",
    "messageHex": "01"
  },
  {
    // Get half balance
    "blockheight": 8, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Set Mode to 3
    "blockheight": 10, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n",
    "messageHex": "03",
     "tokens": [
       {"asset": 112233, "quantity": 100}
    ]
  },
  {
    // Get one token
    "blockheight": 12, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Set Mode to 2 again:
    "blockheight": 14, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n",
    "messageHex": "02"
  },
  {
    // Get message again
    "blockheight": 16, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Set Mode to 0
    "blockheight": 18, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Contract ends
    "blockheight": 20, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  }
]
```
