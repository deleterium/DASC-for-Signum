# Fortune's message

Contract will give a random advice for each incoming message. Also an example using JMPR.

```
.data

msg_0[4] "Luck favors the prepared mind.  "
msg_1[4] "Your kindness will be repaid.   "
msg_2[4] "Dream big, start small, act now."
msg_3[4] "A smile is your best asset.     "
msg_4[4] "Patience leads to great rewards."
msg_5[4] "Your courage inspires others.   "
msg_6[4] "Every day brings new chances.   "
msg_7[4] "Challenges are opportunities.   "
msg_8[4] "Joy grows when shared with all. "
msg_9[4] "Hard work brings sweet success. "
msg_10[4] "You are stronger than you know. "
msg_11[4] "A new adventure awaits you.     "
msg_12[4] "Kind words cost nothing, try.   "
msg_13[4] "Today is full of possibilities. "
msg_14[4] "Every setback hides a lesson.   "
msg_15[4] "Small steps lead to big dreams. "

.bss
  creator
  currentTX_txid
  currentTX_sender
  currentTX_amount
  luckyNumber
  randomNumber
  startOfCode

.code

setup:
  SYS getCreator, creator
  SET16 startOfCode, &m0

start:
  SYS getWeakRandomNumber, randomNumber
  SHR randomNumber, 1

messageLoop:
  SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
  BX currentTX_txid != 0, _ifA_endif
    HARA start
  _ifA_endif:

  BX currentTX_sender != creator, _ifC_endif
    RST
  _ifC_endif:

  SET luckyNumber, randomNumber
  MOD luckyNumber, 16
  DIV randomNumber, 16
  BX randomNumber >= 16, _ifB_endif
    SLEEP 1
    JMP start
  _ifB_endif:
  
  SET $, luckyNumber
  MUL $, 0x05
  ADD $, startOfCode
  JMPR

m0:
  SYS sendMessage, msg_0_0, currentTX_sender
  BA messageLoop
m1:
  SYS sendMessage, msg_1_0, currentTX_sender
  BA messageLoop
m2:
  SYS sendMessage, msg_2_0, currentTX_sender
  BA messageLoop
m3:
  SYS sendMessage, msg_3_0, currentTX_sender
  BA messageLoop
m4:
  SYS sendMessage, msg_4_0, currentTX_sender
  BA messageLoop
m5:
  SYS sendMessage, msg_5_0, currentTX_sender
  BA messageLoop
m6:
  SYS sendMessage, msg_6_0, currentTX_sender
  BA messageLoop
m7:
  SYS sendMessage, msg_7_0, currentTX_sender
  BA messageLoop
m8:
  SYS sendMessage, msg_8_0, currentTX_sender
  BA messageLoop
m9:
  SYS sendMessage, msg_9_0, currentTX_sender
  BA messageLoop
m10:
  SYS sendMessage, msg_10_0, currentTX_sender
  BA messageLoop
m11:
  SYS sendMessage, msg_11_0, currentTX_sender
  BA messageLoop
m12:
  SYS sendMessage, msg_12_0, currentTX_sender
  BA messageLoop
m13:
  SYS sendMessage, msg_13_0, currentTX_sender
  BA messageLoop
m14:
  SYS sendMessage, msg_14_0, currentTX_sender
  BA messageLoop
m15:
  SYS sendMessage, msg_15_0, currentTX_sender
  BA messageLoop
```

The same result can be obtained without JMPR, but with self modifying code.
This code was extended to the limit of a contract, reaching 985 out of 992 bytes possible.
```
.data
msg_0[4] "Luck favors the prepared mind.  "
msg_1[4] "Your kindness will be repaid.   "
msg_2[4] "Dream big, start small, act now."
msg_3[4] "A smile is your best asset.     "
msg_4[4] "Patience leads to great rewards."
msg_5[4] "Your courage inspires others.   "
msg_6[4] "Every day brings new chances.   "
msg_7[4] "Challenges are opportunities.   "
msg_8[4] "Joy grows when shared with all. "
msg_9[4] "Hard work brings sweet success. "
msg_10[4] "You are stronger than you know. "
msg_11[4] "A new adventure awaits you.     "
msg_12[4] "Kind words cost nothing, try.   "
msg_13[4] "Today is full of possibilities. "
msg_14[4] "Every setback hides a lesson.   "
msg_15[4] "Small steps lead to big dreams. "
msg_16[4] "A single thought triggers peace."
msg_17[4] "Bravery opens unseen doors.     "
msg_18[4] "Your efforts will be rewarded.  "
msg_19[4] "Joy is everwhere. Find it!      "
msg_20[4] "Stay curious, keep exploring.   "
msg_21[4] "A kind heart changes everything."
msg_22[4] "Wisdom grows from your mistakes."
msg_23[4] "Your ideas will shape the future"
msg_24[4] "Laughter heals the soul.        "
msg_25[4] "Good things come to the patient."
msg_26[4] "Hope is the seed of success.    "

.define numberOfMessages 27

.define p_creator          255  # Using high memory for these
.define p_currentTX_txid   254  # variables. Avoid allocating
.define p_currentTX_sender 253  # them at bss section, reducing
.define p_currentTX_amount 252  # code size
.define p_luckyNumber      251
.define p_randomNumber     250

.bss
  adrOfSendMessage
  fnSendMessageBytes

.code
setup:
  SYS getCreator, *p_creator
  SET16 adrOfSendMessage, &sendMessage # Calculate the address of sendMessage
  DIV adrOfSendMessage, 8
  SET fnSendMessageBytes, *adrOfSendMessage # Get compiled code of sendMessage and change
  SET16 $, 0x00FF                      # the variable to zero
  SHL $, 8                             # It will be updated each execution
  NOT $
  AND fnSendMessageBytes, $
  BA start
  NOP
  NOP

sendMessage:         # Aligned manually to 8 (TODO add .align directive in compiler)
  SYS sendMessage, msg_0_0, *p_currentTX_sender
  RET
  RST
  RST
  RST
  RST

start:
  SYS getWeakRandomNumber, *p_randomNumber
  SHR *p_randomNumber, 1

messageLoop:
  SYS getNextTxDetails, *p_currentTX_txid, *p_currentTX_sender, *p_currentTX_amount
  BX *p_currentTX_txid != 0, _ifA_endif
    HARA start
  _ifA_endif:

  BX *p_currentTX_sender != *p_creator, _ifC_endif
    RST
  _ifC_endif:

  BX *p_randomNumber >= numberOfMessages, _ifB_endif
    SLEEP 1
    JMP start
  _ifB_endif:
  SET *p_luckyNumber, *p_randomNumber
  MOD *p_luckyNumber, numberOfMessages
  DIV *p_randomNumber, numberOfMessages
  
  SET $, *p_luckyNumber
  MUL $, 0x04
  ADD $, &msg_0_0
  SHL $, 8
  OR  $, fnSendMessageBytes
  SET *adrOfSendMessage, $        # overwrite compiled code with the changed code
  CALL sendMessage                # call changed code
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
    "messageHex": ""
  },
  {
    // New message
    "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // New message
    "blockheight": 6, "sender": "667n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // New message
    "blockheight": 8, "sender": "668n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  {
    // New message
    "blockheight": 10, "sender": "666n", "recipient": "999n", "amount": "2_0000_0000n"
  },
  // 20 new requests at same block. Expect end of entropy and continue next block.
  { "blockheight": 12, "sender": "681n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "682n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "683n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "684n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "685n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "686n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "687n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "688n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "689n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "690n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "691n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "692n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "693n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "694n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "695n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "696n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "697n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "698n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "699n", "recipient": "999n", "amount": "2_0000_0000n" },
  { "blockheight": 12, "sender": "700n", "recipient": "999n", "amount": "2_0000_0000n" },
  {
    // End contract
    "blockheight": 20, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n"
  }
]
```
