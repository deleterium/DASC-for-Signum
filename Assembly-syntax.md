# DASC assembly language syntax

## Comments
Any text placed after a ` # `, including the # symbol, is a comment and will not be parsed.

## The register

Use ` $ ` to reference the general use register R. Special register for the return address can only be accessed by instruction **SRA** or **LRA**.

## Labels

Lines with a word that includes only simple chars, numbers and underscore followed by `:` are considered labels.

## Instructions

Enter a instruction name and, if the instruction needs arguments, place them separated by comas.

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
This program will execute the no-operation instruction and then exit. All programs will end if there is no instuction or if they jump to an address without code.

### Simple infinite loop
```
loop:
    BA loop
```
Execute the instruction branch always, then jump to it again.

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
