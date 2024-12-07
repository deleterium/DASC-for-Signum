# Megasena
This contract draws 6 numbers from 01 to 60, both included, and sends back to sender.
It also sorts the numbers using a binary tree.
Note the contract in C is very complex, including recursion and pointers to struct.

## C contract
```c
#pragma maxAuxVars 4
#pragma verboseAssembly

struct TXINFO {
    long txid;
    long sender;
} currentTX;

long message[4];

struct DATA {
    long value;
    struct DATA *left,
         *rigth;
} numbers[6];

long id, ivalue;

void main() {
    struct DATA *entryNode;

    while ((currentTX.txid = getNextTx()) != 0) {
        // get details
        currentTX.sender = getSender(currentTX.txid);
        message[] = "                                ";
        long random = getWeakRandomNumber() >> 1;
        entryNode = &numbers[0];
        clearNodes();
        for (long i=0; i<6; i++) {
            ivalue = random % 60;
            if (ivalue == 0) ivalue = 60;
            random /= 60;
            if (insert(entryNode) == 0) {
               i--;
            }
        }
        id = 0;
        inorder_traversal(entryNode);
        sendMessage(message, currentTX.sender);
        sleep 1;
    }
}

void clearNodes() {
    id = 0;
    numbers[0].value = -1;
}

struct DATA * createNode() {
    struct DATA *newNode;
    id++;
    newNode = &numbers[id];
    newNode->value = ivalue;
    newNode->left = NULL;
    newNode->rigth = NULL;
    return newNode;
}

long insert(struct DATA *item) {
    if (item->value == -1) {
        item->value = ivalue;
        item->left = NULL;
        item->rigth = NULL;
        return true;
    }
    if (ivalue < item->value) {
        if (item->left == NULL) {
            item->left = createNode();
            return true;
        }
        return insert(item->left);
    }
    if (ivalue > item->value) {
        if (item->rigth == NULL) {
            item->rigth = createNode();
            return true;
        }
        return insert(item->rigth);
    } 
    return false; // repetition not allowed
}

void inorder_traversal(struct DATA * item) {
    if (item == NULL) {
        return;
    }
    inorder_traversal(item->left);
    message[id / 2] |= ltoa(item->value) << ((id % 2) * 32);
    id++;
    inorder_traversal(item->rigth);
}

const long n8 = 8, n10 = 10;

long ltoa(long val)
{
    long ret;
        ret = "0" + val % 10;
        val /= 10;
        ret <<= 8;
        ret |= "0" + val % 10;
    return ret;
}
```

## DASC contract
The generated assembly code from C program was transpiled manually to DASC.
The code is pretty straigth forward to transpile, but there was some problems.
It was needed to add two stacks for recursive functions.
One to keep track of code return address, managed by variable `returnStackIndex` and other to keep local variables on recursion, managed by variable `userStackIndex`.
It was also needed to add an additional activation amount, because this contract takes around 700 steps each execution. So only transactions above 60 signa will trigger the full execution.
When creator sends a transaction, the contract is unloaded.

```
.bss
  r0
  r1
  r2
  r3
  currentTX_txid
  currentTX_sender
  currentTX_amount
  message[4]
  numbers_0_value
  numbers_0_left
  numbers_0_rigth
  numbers_1_value
  numbers_1_left
  numbers_1_rigth
  numbers_2_value
  numbers_2_left
  numbers_2_rigth
  numbers_3_value
  numbers_3_left
  numbers_3_rigth
  numbers_4_value
  numbers_4_left
  numbers_4_rigth
  numbers_5_value
  numbers_5_left
  numbers_5_rigth
  id
  ivalue
  main_entryNode
  main_random
  main_i
  createNode_newNode
  insert_item
  inorder_traversal_item
  ltoa_val
  ltoa_ret
  creator


.data
  spaces           "        "
  returnStackIndex 255
  userStackIndex   235
  activationAmount 58_0000_0000

.code
setup:
  SYS getCreator, creator


# ********************************** main
# line 20 void main() {
start:
# line 23     while ((currentTX.txid = getNextTx()) != 0) {
__loop1_continue:
  SYS getNextTxDetails, currentTX_txid, currentTX_sender, currentTX_amount
  BX currentTX_txid != 0, __opt_1
  HARA start
__opt_1:
# if (currentTX_sender == creator) RESET;
  BX currentTX_sender != creator, not_creator
  RST
not_creator:
# if (currentTX_amount < activationAmount) continue;
  BX currentTX_amount >= activationAmount, good_amount
  BA __loop1_continue
good_amount:
# line 26         message[] = "                                ";
  SET message_0, spaces
  SET message_1, spaces
  SET message_2, spaces
  SET message_3, spaces
# line 27         long random = getWeakRandomNumber() >> 1;
  SYS getWeakRandomNumber, main_random
  SHR main_random, 1
# line 28         entryNode = &numbers[0];
  SET main_entryNode, &numbers_0_value
# line 29         clearNodes();
  CALL __fn_clearNodes
# line 30         for (long i=0; i<6; i++) {
  SET main_i, 0
__loop3_condition:
  BX main_i >= 6, __loop3_break
# line 31             ivalue = random % 60;
  SET ivalue, main_random
  MOD ivalue, 60
# line 32             if (ivalue == 0) ivalue = 60;
  BX ivalue != 0, __if4_endif
  SET ivalue, 60
__if4_endif:
# line 33             random /= 60;
  DIV main_random, 60
# line 34             if (insert(entryNode) == 0) {
  SET insert_item, main_entryNode
  CALL __fn_insert
  BX r0 != 0, __if5_endif
# line 35                i--;
  SUB main_i, 1
__if5_endif:
# line 30         for (long i=0; i<6; i++) {
  ADD main_i, 1
  BA __loop3_condition
__loop3_break:
# line 38         id = 0;
  SET id, 0
# line 39         inorder_traversal(entryNode);
  SET inorder_traversal_item, main_entryNode
  CALL __fn_inorder_traversal
# line 40         sendMessage(message, currentTX.sender);
  SYS sendMessage, message_0, currentTX_sender
# line 41         sleep 1;
  SLEEP 1
# line 42     }
# line 43 }
  BA __loop1_continue

# ********************************** clearNodes
# line 45 void clearNodes() {
__fn_clearNodes:
# line 46     id = 0;
  SET id, 0
# line 47     numbers[0].value = -1;
  SET numbers_0_value, -1
# line 48 }
  RET

# ********************************** createNode
# line 50 struct DATA * createNode() {
__fn_createNode:
# line 52     id++;
  ADD id, 1
# line 53     newNode = &numbers[id];
  SET $, 3
  MUL $, id
  SET createNode_newNode, &numbers_0_value
  ADD createNode_newNode, $
# line 54     newNode->value = ivalue;
  SET *createNode_newNode, ivalue
# line 55     newNode->left = NULL;
  SET r0, createNode_newNode
  ADD r0, 1
  SET *r0, 0
# line 56     newNode->rigth = NULL;
  ADD r0, 1
  SET *r0, 0
# line 57     return newNode;
  SET r0, createNode_newNode
  RET

# ********************************** insert
# line 60 long insert(struct DATA *item) {
__fn_insert:
  SRA
  SET *returnStackIndex, $
  SUB returnStackIndex, 1
# line 61     if (item->value == -1) {
  BX *insert_item != -1, __if6_endif
# line 62         item->value = ivalue;
  SET *insert_item, ivalue
# line 63         item->left = NULL;
  SET r0, insert_item
  ADD r0, 1
  SET *r0, 0
# line 64         item->rigth = NULL;
  ADD r0, 1
  SET *r0, 0
# line 65         return true;
  SET r0, 1
  RET
__if6_endif:
# line 67     if (ivalue < item->value) {
  BX ivalue >= *insert_item, __if7_endif
# line 68         if (item->left == NULL) {
  SET r0, insert_item
  ADD r0, 1
  BX *r0 != 0, __if8_endif
# line 69             item->left = createNode();
  CALL __fn_createNode
  SET r1, insert_item
  ADD r1, 1
  SET *r1, r0
# line 70             return true;
  SET r0, 1
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET
__if8_endif:
# line 72         return insert(item->left);
  SET *userStackIndex, insert_item
  SUB userStackIndex, 1
  SET r0, insert_item
  ADD r0, 1
  SET insert_item, *r0
  CALL __fn_insert
  ADD userStackIndex, 1
  SET insert_item, *userStackIndex
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET
__if7_endif:
# line 74     if (ivalue > item->value) {
  BX ivalue <= *insert_item, __if9_endif
# line 75         if (item->rigth == NULL) {
  SET r0, insert_item
  ADD r0, 2
  BX *r0 != 0, __ifa_endif
# line 76             item->rigth = createNode();
  CALL __fn_createNode
  SET r1, insert_item
  ADD r1, 2
  SET *r1, r0
# line 77             return true;
  SET r0, 1
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET
__ifa_endif:
# line 79         return insert(item->rigth);
  SET *userStackIndex, insert_item
  SUB userStackIndex, 1
  SET r0, insert_item
  ADD r0, 2
  SET insert_item, *r0
  CALL __fn_insert
  ADD userStackIndex, 1
  SET insert_item, *userStackIndex
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET
__if9_endif:
# line 81     return false; // repetition not allowed
  SET r0, 0
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET

# ********************************** inorder_traversal
# line 84 void inorder_traversal(struct DATA * item) {
__fn_inorder_traversal:
  SRA
  SET *returnStackIndex, $
  SUB returnStackIndex, 1
# line 85     if (item == NULL) {
  BX inorder_traversal_item != 0, __ifb_endif
# line 86         return;
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET
__ifb_endif:
# line 88     inorder_traversal(item->left);
  SET *userStackIndex, inorder_traversal_item
  SUB userStackIndex, 1
  SET r0, inorder_traversal_item
  ADD r0, 1
  SET inorder_traversal_item, *r0
  CALL __fn_inorder_traversal
  ADD userStackIndex, 1
  SET inorder_traversal_item, *userStackIndex
# line 89     message[id / 2] |= ltoa(item->value) << ((id % 2) * 32);
  SET ltoa_val, *inorder_traversal_item
  CALL __fn_ltoa
  SET r1, id
  MOD r1, 2
  SET $, 0x20
  MUL $, r1
  SHL r0, $
  SET r3, id
  DIV r3, 2
  SET r1, &message_0
  ADD r1, r3
  SET $, *r1
  OR  $, r0
  SET *r1, $
# line 90     id++;
  ADD id, 1
# line 91     inorder_traversal(item->rigth);
  SET *userStackIndex, inorder_traversal_item
  SUB userStackIndex, 1
  SET r0, inorder_traversal_item
  ADD r0, 2
  SET inorder_traversal_item, *r0
  CALL __fn_inorder_traversal
  ADD userStackIndex, 1
  SET inorder_traversal_item, *userStackIndex
  ADD returnStackIndex, 1
  SET $, *returnStackIndex
  LRA
  RET

# ********************************** ltoa
# line 96 long ltoa(long val)
__fn_ltoa:
# line 99     ret = "0" + val % 10;
  SET ltoa_ret, ltoa_val
  MOD ltoa_ret, 10
  ADD ltoa_ret, 0x30
# line 100    val /= 10;
  DIV ltoa_val, 10
# line 101    ret <<= 8;
  SHL ltoa_ret, 8
# line 102    ret |= "0" + val % 10;
  SET $, ltoa_val
  MOD $, 10
  ADD $, 0x30
  OR  ltoa_ret, $
# line 103    return ret;
  SET r0, ltoa_ret
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
    "amount": "2_0000_0000n",
    "messageHex": "56534331020a1b002020202020202020ff00000000000000eb0000000000000000c44f9501000000000000000000000000000000000000000000000000000000c52cd4090a0bbf710903b78201bf150a2c0100bf450b0402bee8150c01150d01150e01150f01c425962501162410b5eb01162600bf46260622152325e6233cbf71230316233c56253c152824b51702bf710503362601262601bed9162200152924b5ca02cd0c0af201be971622001610ffb02622011605034505221627102527051d27231505272605011e05002605011e0500150527b0b21c02360201bf1e28ff161d28231505282605011e05002605011e0500160501b0bf4723283f150528260501bf730516b5f2011506282606011d06051605012602011302b3b01d0328360301150528260501172805b517022603011728032602011302b3b0bf5723283f150528260502bf730516b5f2011506282606021d06051605012602011302b3b01d0328360301150528260502172805b517022603011728032602011302b3b01605002602011302b3b0b21c02360201bf7129072602011302b3b01d0329360301150529260501172905b5ca02260301172903150822560802172a29b53f03150622e6060216072045070685050716060c2506081707066507051d06072622011d0329360301150529260502172905b5ca022603011729032602011302b3b0152b2ae62b0a262b30562a0a862b0815052ae6050a260530652b0515052bb0"
  },
  {
    // Expect nothing
    "blockheight": 4, "sender": "666n", "recipient": "999n", "amount": "10_0000_0000n"
  },
  // Expect many draws
  { "blockheight": 6, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 8, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 10, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 12, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 14, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 16, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 18, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  { "blockheight": 20, "sender": "666", "recipient": "999n", "amount": "60_0000_0000n" },
  {
    // Contract ends
    "blockheight": 24, "sender": "555n", "recipient": "999n", "amount": "2_0000_0000n"
  }
]
```