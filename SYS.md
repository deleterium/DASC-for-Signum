## Function types for the SYS opCode

Check all 32 system functions that are included. They follow the same name from built-in funcions in SmartC.

| Class | Func | Name | arg1, arg2, arg3, arg4, arg5 |
| --- | --- | --- | --- |
| Assets | 0x12 | mintAsset | quantity, assetId |
| Assets | 0x13 | getAssetCirculating | retVal, assetId |
| Assets | 0x1B | getAssetHoldersCount | retVal, minimumQuantity, assetId |
| Assets | 0x1E | issueAsset | retVal, name1, name2, decimals |
| Assets | 0x1F | distributeToHolders | holdersAssetMinQuantity, holdersAsset, amountToDistribute, assetToDistribute, quantityToDistribute |
| Blockchain | 0x03 | getCurrentBlockheight | retVal |
| Blockchain | 0x04 | getWeakRandomNumber | retVal |
| Contract | 0x05 | getCreator | retVal |
| Contract | 0x06 | getCurrentBalance | retVal |
| Contract | 0x0E | getCreatorOf | retVal, contractId |
| Contract | 0x0F | getCodeHashOf | retVal, contractId |
| Contract | 0x10 | getActivationOf | retVal, contractId |
| Contract | 0x11 | getAssetBalance | retVal, assetId |
| LoopingTX | 0x00 | getTxLoopTimestamp | retVal |
| LoopingTX | 0x01 | setTxLoopTimestamp | timestampTX |
| LoopingTX | 0x14 | getNextTxDetails | transaction, sender, amount |
| Map | 0x19 | setMapValue | key1, key2, value |
| Map | 0x1A | getMapValue | retVal, key1, key2 |
| Map | 0x1D | getExtMapValue | retVal, key1, key2, contractId |
| Receiving | 0x07 | getBlockheight | retVal, transaction |
| Receiving | 0x08 | getAmount | retVal, transaction |
| Receiving | 0x09 | getSender | retVal, transaction |
| Receiving | 0x0A | getType | retVal, transaction |
| Receiving | 0x0B | readAssets | transaction, * buffer |
| Receiving | 0x15 | readMessage | transaction, page, * buffer |
| Receiving | 0x16 | getQuantity | retVal, transaction, assetId |
| Sending | 0x02 | sendBalance | accountId |
| Sending | 0x0C | sendAmount | amount, accountId |
| Sending | 0x0D | sendMessage | * buffer, accountId |
| Sending | 0x17 | sendAmountAndMessage | amount, * buffer, accountId |
| Sending | 0x18 | sendQuantity | quantity, assetId, accountId |
| Sending | 0x1C | sendQuantityAndAmount | quantity, assetId, amount, accountId, quantityToDistribute |

Notes:
1) All arguments must be variables. It is not possible to pass a pointer (VAR), the register R, nor the register RA.
2) The argument `* buffer` is actually the first variable from a group of 4. This mean the call will write not only the first variable, but also the three next.
3) Including functions `getTxLoopTimestamp` and `setTxLoopTimestamp` that can be used to rewind or advance the transactions loop of `getNextTxDetails`.
4) Using the transactions loop will also advance the VM variables for the transactions loop. This means if the VSC ends, the VM contract will only process newly arrived transactions.

[Back](./README.md)

