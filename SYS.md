## Function types for the SYS opCode

Check all 32 system functions that are included. They follow the same name from built-in funcions in SmartC.

| Class | Func | Name | arg1, arg2, arg3, arg4, arg5 |
| --- | --- | --- | --- |
| Assets | 0x13 | mintAsset | quantity, assetId |
| Assets | 0x14 | getAssetCirculating | retVal, assetId |
| Assets | 0x1B | getAssetHoldersCount | retVal, minimumQuantity, assetId |
| Assets | 0x1E | issueAsset | retVal, name1, name2, decimals |
| Assets | 0x1F | distributeToHolders | holdersAssetMinQuantity, holdersAsset, amountToDistribute, assetToDistribute |
| Blockchain | 0x04 | getCurrentBlockheight | retVal |
| Blockchain | 0x05 | getWeakRandomNumber | retVal |
| Contract | 0x06 | getCreator | retVal |
| Contract | 0x07 | getCurrentBalance | retVal |
| Contract | 0x0F | getCreatorOf | retVal, contractId |
| Contract | 0x10 | getCodeHashOf | retVal, contractId |
| Contract | 0x11 | getActivationOf | retVal, contractId |
| Contract | 0x12 | getAssetBalance | retVal, assetId |
| LoopingTX | 0x00 | getNextTx | retVal |
| LoopingTX | 0x01 | getTxLoopTimestamp | retVal |
| LoopingTX | 0x02 | setTxLoopTimestamp | timestampTX |
| Map | 0x19 | setMapValue | key1, key2, value |
| Map | 0x1A | getMapValue | retVal, key1, key2 |
| Map | 0x1D | getExtMapValue | retVal, key1, key2, contractId |
| Receiving | 0x08 | getBlockheight | retVal, transaction |
| Receiving | 0x09 | getAmount | retVal, transaction |
| Receiving | 0x0A | getSender | retVal, transaction |
| Receiving | 0x0B | getType | retVal, transaction |
| Receiving | 0x0C | readAssets | transaction, * buffer |
| Receiving | 0x15 | readMessage | transaction, page, * buffer |
| Receiving | 0x16 | getQuantity | retVal, transaction, assetId |
| Sending | 0x03 | sendBalance | accountId |
| Sending | 0x0D | sendAmount | amount, accountId |
| Sending | 0x0E | sendMessage | * buffer, accountId |
| Sending | 0x17 | sendAmountAndMessage | amount, * buffer, accountId |
| Sending | 0x18 | sendQuantity | quantity, assetId, accountId |
| Sending | 0x1C | sendQuantityAndAmount | quantity, assetId, amount, accountId, quantityToDistribute |

Notes:
1) All arguments must be variables. It is not possible to pass a pointer (VAR), the register R, nor the register RA.
2) The argument `* buffer` is actually the first variable from a group of 4. This mean the call will write not only the first variable, but also the three next.
3) Including functions `getTxLoopTimestamp` and `setTxLoopTimestamp` that can be used to rewind or advance the transactions loop of `getNextTx`.
4) Using the transactions loop will also advance the VM variables for the transactions loop. This means if the VSC ends, the VM contract will only process newly arrived transactions.

[Back](./README.md)

