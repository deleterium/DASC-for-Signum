# DASC Raffle

This program receive incoming transactions and then pick one to be the raffle winner.
Each account can register only once.
It is suggested the creator add some balance during contract deployment and then people can participate with a simple transaction above the contract activation.

## SimpleIDE contract

```
.data
  duration     20   # Contest duration in blocks
  participants 0
  valMinusOne  -1
  val1000      1000
  val1001      1001
  twoSigna     2_0000_0000
  alreadyRegistered[4] "TKS! Account already registered!"
  thankYou[4]          "Registered at DASC Raffle!      "
  winnerMessage[4]     "The prize is yours!             "

.bss
  thisBlock
  endBlock
  currentTX_txid
  currentTX_sender
  currentTX_amount
  mapValue
  luckyUser
  luckyNumber
  prize

.code

setup:
  SYS getCurrentBlockheight, endBlock
  ADD endBlock, duration

start:
  SYS getCurrentBlockheight, thisBlock
  if thisBlock >= endBlock
    call DRAW
  endif

  repeat
    SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
    if currentTX_txid == 0
      HARA start
    endif
    SYS getMapValue, mapValue, val1000, currentTX_sender
    if mapValue == -1
      SYS sendMessage, alreadyRegistered_0, currentTX_sender
      continue
    endif
    SYS setMapValue, val1000, currentTX_sender, valMinusOne
    SYS setMapValue, val1001, participants, currentTX_sender
    ADD participants, 1
    SYS sendMessage, thankYou_0, currentTX_sender
  loop

DRAW:
  SYS getWeakRandomNumber, luckyNumber
  SHR luckyNumber, 1
  MOD luckyNumber, participants
  SYS getMapValue, luckyUser, val1001, luckyNumber
  SYS getCurrentBalance, prize
  SUB prize, twoSigna
  SYS sendAmountAndMessage, prize, winnerMessage_0, luckyUser
  RST
```

# SC-Simulator testcases

```js
[
  // Read the complete help at https://github.com/deleterium/SC-Simulator/blob/main/README.md
  {
    // Yes, comments are allowed! Here sending a text message.
    "blockheight": 2,
    "sender": "555n",
    "recipient": "999n",
    "amount": "1002_0000_0000n",
    "messageHex": "5653433105020a0014000000000000000000000000000000ffffffffffffffffe803000000000000e90300000000000000c2eb0b00000000544b5321204163636f756e7420616c726561647920726567697374657265642152656769737465726564206174204441534320526166666c6521202020202020546865207072697a6520697320796f75727321202020202020202020202020200000000000000000c314251401c313bf35131403b51801d4151617bf711503b7e500da180416bf1618ff05cd0716bee7d9041603d9050216260201cd0b16bed7c41a961a01e51a02da19051ac61b351b06d71b0f1900"
  },
  {
    // New participant
    "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // New participant
    "blockheight": 6, "sender": "667n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // New participant
    "blockheight": 8, "sender": "668n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Duplicated participant
    "blockheight": 10, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // 3 new participants same block
    "blockheight": 12, "sender": "670n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // 3 new participants same block
    "blockheight": 12, "sender": "671n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // 3 new participants same block
    "blockheight": 12, "sender": "672n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // Activate draw
    "blockheight": 23, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n"
  }
]```

