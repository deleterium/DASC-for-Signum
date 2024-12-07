# Execute message
Contract only process messages from creator.
It reserves 32 bytes for code execution.
To use it, compile the code with func1 and func2 commented and deploy it.
Uncomment func1, compile code and send that piece of code as message to the contract.
Same for func2.

## Assembly contract
```
.data
  zero 0

.bss
  currentTX_txid
  currentTX_sender
  currentTX_amount
  codeBuffer[4]
  creator

.code

setup:
  SYS getCreator, creator

messageLoop:
  SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
  BX currentTX_txid != 0, _if37_endif
    HARA messageLoop
  _if37_endif:
  BX currentTX_sender != creator, messageLoop

  SYS readMessage, currentTX_txid, zero, codeBuffer_0
  CALL &codeBuffer_0
  BA messageLoop

# Send half balance to creator
#func1:
#  SYS getCurrentBalance, *64
#  DIV *64, 2
#  SYS sendAmount, *64, creator
#  RET

# Send 10 signa to account 9438801973557616624 and then half of remaining to creator
#func2:
#  SET64 *65, 9438801973557616624
#  SET64 *64, 10_0000_0000
#  SYS sendAmount, *64, *65
#  SYS getCurrentBalance, *64
#  DIV *64, 2
#  SYS sendAmount, *64, creator
#  RET
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
    "messageHex": "5653433101020400000000000000000000000000000000000000000000000000c509d4020304bf710203b76200bf150309f0d5020105b52800bee7"
  },
  {
    // Do nothing
    "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Send half balance to creator
    "blockheight": 6, "sender": "555", "recipient": "999n", "amount": "2_0000_0000n",
    "messageHex": "c640564002cc4009b0"
  },
  {
    // Send 10 signa to account 9438801973557616624 and then half of remaining to creator
    "blockheight": 8, "sender": "555", "recipient": "999n", "amount": "2_0000_0000n",
    "messageHex": "fd41f05f28d3625cfd82fd4000ca9a3b00000000cc4041c640564002cc4009b0"
  },
  {
    // Reset program: empty message
    "blockheight": 10, "sender": "555", "recipient": "999n", "amount": "2_0000_0000n"
  }
]
```
