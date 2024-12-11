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

### Section .bss
Declare all variables that will not be initialized (or zeroed if explicit)

#### .zeroall
Request that all variables in bss must be initialized to zero.

#### varname
Declare a single variable.
* `age`

#### varname\[varsize\]
Declare a multi-long variable. Variables will have sufix `_N` for each item.
* `name[4]`
This will create four variables in sequence to be used in code with names `name_0`, `name_1`, `name_2` and `name_3`

### section .data
Declare all variables that must be initialized.

#### .define
Use to create friendly names for numbers. These defines will be replaced to the value during code compilation, but only at the .code section. First argument is the friendly name and second the value to be replaced.
* `.define lastVarAdr 255`
* `.define firstFreeMem 16`

#### varname value
Declare and initialize a single variable.
* `startingAge 18`
* `zero 0x0`
* `neg5 -5`
* `command1 "add"`

#### varname\[varsize\] value
Declare and initialize a multi-long variable.
* `defaultName[4] "Mr. Nobody"`
* `welcomeMessage[4] "Nice message up to 32 chars     "`
* `example[3] [ 1823525992471050800, 0xfede, "auxiliar" ]`

Examples using the above variables:
* `SET a, defaultName_0` Variable a receives "Mr. Nobo".
* `SET b, defaultName_1` Variable b receives "dy".
* `SET c, &defaultName_0` Variable c receives the address of variable defaultName_0
* `SET d, *c` Variable d receives "Mr. Nobo".
* `SYS sendMessage, welcomeMessage_0, recipient` Sends the message "Nice message up to 32 chars     " to the account in the variable recipient.

### Section .code
Write the assembly code in this section. Check tutorial.

## Tutorial - Simple programs

### No operation
```
.code
    NOP
    RST
```
This program will execute the no-operation instruction and then return the the VM contract (RST / reset). All programs must end with a reset  or they can execute arbitrary code from previous programs.

### Simple infinite loop
```
.code
loop:
    BA loop
```
Execute the instruction branch always, then jump to it again. This program will never return the control to the VM contract.

### Countdown from 10 to zero
```
.data
    a 10

.code
loop:
    SET $, a
    BZ loop_end
    NOP        # do your stuff
    SUB a, 1
    BA loop    # same as JMP loop
loop_end:
    NOP        # do your stuff
    RST        # reset
```
| Code | Description |
| --- | --- |
|    a 10 | New variable `a` have its value set to 10 at initialization |
|loop: | Label
|    SET $, a | Sets `register` to the value of `a` |
|    BZ loop_end | If `register` is zero, jump to `loop_end` |
|    NOP | No-operation, simulating you program doing something |
|    SUB a, 1 | Decrement variable `a` by `1` |
|    BA loop | Jump always to `loop` |
|loop_end: | Label |
|    NOP |  No-operation, simulating you program doing something at the end |
|    RST |  Reset and leave control to VM |

### Scheduled Signa transfer
```
.data
    recipient 13597014728686028653 # Account ID
    amount    97_0000_0000 # Amount in NQT
    atBlock   1101772 # Desired block

.bss
    currBlock

.code
    SYS getCurrentBlockheight, currBlock
    SET $, atBlock
    SUB $, currBlock
    SLEEP $
    SYS sendAmount, amount, recipient
    SYS getCreator, recipient
    SYS sendBalance, recipient
    RST
```
This program will send the desired amount of Signa to some address at a given blockheight. After sending, the program will return all remaining balance to the creator. Once done, the VM can be used again. Remember to add enough balance to the contract: the desired amount plus 3 signa to ensure contract will run until the end.

### Looping incoming transactions - simple

```
.bss
    creator
    txId
    sender
    amount

.code
    SYS getCreator, creator
main:
    SYS getNextTxDetails, txId, sender, amount
    BX txId == 0, loop_break

    SHR amount, 1
    SYS sendAmount, amount, sender
    BA main

.bss
    curBal

.data
    oneSigna 1_0000_0000

.code
loop_break:
    SYS getCurrentBalance, curBal
    SUB curBal, oneSigna
    SYS sendAmount, curBal, creator
    HARA main
```
This example program will return half of the incoming balance received back to sender. After no more transactions to process, the contract will then send almost all balance to the contract creator, keeping one signa to pay fees for the VSC to end gracefully. Note that sections can be splitted in the code. This program will never return control to the VM!

### Looping incoming transactions - complete
```
.data
    oneSigna             1_0000_0000
    contractActivation  10_0000_0000
    end                  0

.bss
    creator
    txId
    sender
    amount
    curBal

.code
setup:
    SYS getCreator, creator
main:
    SYS getNextTxDetails, txId, sender, amount
    BX txId == 0, no_more_tx

    SUB amount, contractActivation
    BX amount < 0, main # do not process if too low

    BX sender != creator, process_tx
    SET end, 1         # Contract will end
    BA main

process_tx:            # Do your stuff
    SHR amount, 1      # Divide amount by 2
    SYS sendAmount, amount, sender
    BA main

no_more_tx:            # Do your stuff
    SYS getCurrentBalance, curBal
    SUB curBal, oneSigna
    SYS sendAmount, curBal, creator

    BX end == 0, wait_next_activation
    RST
wait_next_activation:
    HARA main
```
Now all incoming transactions with amount greater than VM activation PLUS VSC activation will be processed. When it receives a transaction from creator, the contract end after processing all transactions on that block. The ending part (no_more_tx) will also be processed. If ended, the VM will be ready to run a new VSC in the next block. Creator must send another transaction with a new program, because the ending transaction will not be loaded by VM.

### More info
* Check the [testcases](./DASC-VM/testcases.md) for more examples.
* Check fully working samples:
  * [buyToken](./samples/buyToken.md)
  * [DASCtoken](./samples/DASCtoken.md)
  * [ExecuteMessage](./samples/ExecuteMessage.md)
  * [Fortune](./samples/Fortune.md)
  * [FunctionPointerTable](./samples/FunctionPointerTable.md)
  * [Megasena](./samples/Megasena.md)
  * [Raffle](./samples/Raffle.md)
  * [SwapTokens](./samples/SwapTokens.md)
