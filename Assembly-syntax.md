# DASC assembly language syntax and examples

## Comments
Any text placed after a ` # `, including the # symbol, is a comment and will not be parsed.

## The register

Use ` $ ` to reference the general use register R. Special register for the return address can only be accessed by instruction **SRA** or **LRA**.

## Labels

Lines with a word that includes only simple chars, numbers and underscore followed by `:` are considered labels.

## Instructions

Enter a instruction name and, if the instruction needs arguments, place them separated by comas. Instructions are case insensitive.

## Values format

 * Decimal: only numbers
 * Hexadecimal: must start with '0x' and contain numbers or letters a, b, c, d, e and f.
 * Strings: any chars enclosed with double or single quotes. They will be converted to utf-8 bytes. 

## Compiler directives

### adr
Sets a variable to a memory address. First argument is the variable name and second is the address in decimal or hexadecimal values.
* `.adr VAR 25` Links VAR to memory address 25
* `.adr VAR 0xff` Links VAR to memory address 255

### define
Use to create friendly names for numbers. Useful to reference other programs ID. These defines will be replaced to the value during code compilation. First argument is the friendly name and second the value to be replaced.
* `.define MyLib 10183745284846287`
* `.define jmpAddress 0x020f`

### functionInfo
Sets information about the library and/or function that are imported. Place the memory addresses that are used and these locations will not be used by the program. First argument is the function name, followed by the addresses in use. Ranges can be used too.
* `.functionInfo MyLib 50-52, 60, 109` In this case variables 50, 51, 52, 60 and 109 will not be auto-assigned by the compiler

### startingAddress
Sets the memory address to start to auto-assign variables. After this line, all new variables will be placed at a free location that is greater than or equal the starting address supplied. Argument is the starting address value.
* `.startingAddress 0x7f`

### alignCodePage
This directive will cause the next instruction to be placed at the start of a codepage. It's useful to place functions and avoid reading diferent pages if the function is short, or ensure a small loop will be in same code page. This directive is equal to add the instruction `JNCP`. No arguments needed.
* `.alignCodePage`


## Simple programs

### No operation
```
    NOP
```
This program will execute the no-operation instruction and then return the the VM contract (RST or reset). All programs will end with a reset if there is no instuction or if they jump to an address without code.

### Simple infinite loop
```
loop:
    BA loop
```
Execute the instruction branch always, then jump to it again. This program will never return the command to the VM contract.

### Countdown from 10 to zero
```
.startingAddress 16

    SET a, 10
loop:
    SET $, a
    BZ loop_end
    NOP        # do your stuff
    SUB a, 1
    BA loop    # or JMP loop
loop_end:
    NOP        # do your stuff
```
| Code | Description |
| --- | --- |
| .startingAddress 16 | Start use variables at location 16 |
|    SET a, 10 | New variable `a` will be placed at memory address 0x10 and its value will be set to 10 |
|loop: | Label
|    SET $, a | Sets `register` to the value of `a` |
|    BZ loop_end | If `register` is zero, jump to `loop_end` |
|    NOP | No-operation, simulating you program doing something |
|    SUB a, 1 | To end the loop, decrement variable `a` by `1` |
|    BA loop | Jump always to `loop` |
|loop_end: | Label |
|    NOP |  No-operation, simulating you program doing something |

### Scheduled Signa transfer
```
setup:
    SET64 recipient, 13597014728686028653 # Account ID
    SET64 amount, 9700000000 # Amount in NQT
    SET64 atBlock, 1101772 # Desired block

main:
    SYS getCurrentBlockheight, currBlock
    SET $, atBlock
    SUB $, currBlock
    SLEEP $
    SYS sendAmount, amount, recipient
    SYS getCreator, recipient
    SYS sendBalance, recipient

```
This program will send the desired amount of Signa to some address at a given blockheight. After sending, the program will return all remaining balance to the creator. Once done, the VM can be used again. Remember to add enough balance to the contract: the desired amount plus 3 signa to ensure contract will run until the end.

### Looping incoming transactions - simple

```
setup:
    SYS getCreator, creator
    SET64 oneSigna, 100000000

main:
    SYS getNextTxDetails, txId, sender, amount
    SET $, txId
    BZ loop_break

    SHR amount, 1
    SYS sendAmount, amount, sender
    BA main

loop_break:
    SYS getCurrentBalance, curBal
    SUB curBal, oneSigna
    SYS sendAmount, curBal, creator
    HARA main
```
This example program will return half of the incoming balance received back to sender. After no more transactions to process, the contract will then send almost all balance to the contract creator, keeping one signa to pay fees for the VSC to end gracefully.

### Looping incoming transactions - complete
```
setup:
    SYS getCreator, creator
    SET64 oneSigna, 100000000
    SET64 contractActivation, 1000000000
    SET end, 0

.alignCodePage

main:
    SYS getNextTxDetails, txId, sender, amount
    SET $, txId
    BZ no_more_tx

    SUB amount, contractActivation
    SET $, amount
    BLZ main           # do not process if too low
    SHR amount, 1

    SET $, sender
    SUB $, creator
    BNZ process_tx     # Contract will end
    SET end, 1
    BA main

process_tx:            # Do your stuff
    SYS sendAmount, amount, sender
    BA main

no_more_tx:            # Do your stuff
    SYS getCurrentBalance, curBal
    SUB curBal, oneSigna
    SYS sendAmount, curBal, creator

    SET $, end
    BZ wait_next_activation
    RST
wait_next_activation:
    HARA main
```
Now all incoming transactions with amount greater than VM activation PLUS VSC activation will be processed. When it receives a transaction from sender, trigger the contract end. All transactions in same block that this message from sender will be processed. The ending part (no_more_tx) will also be processed. If ended, the VM will be ready to run a new VSC in the next block.
