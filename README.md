# DASC - Deleterium Architecture for Smart Contracts

This projects aims to create an architecture that will be executed by a Smart Contract in Signum blockchain. This contract will act as a Virtual Machine to execute contracts sent as messages to the VM by the VM creator.

## Current status
* Overall: **beta**
* Architecture: beta
* Assembly syntax: beta
* Assembler: beta
* VM Contract: beta

## VM Smart Contract source code

Go to [VM source code](./DASC-VM/README.md).

## Features
* 2 registers (64-bit)
* 256 memory variables (64-bit)
* Maximum program size 992 bytes. It is limited by Signum maximum message size (1000 bytes)
* Programs can call other programs.
* No stack memory.

## Registers
There are two registers.
* The general use register **R** will be used by branches and library instructions. It is a 64-bit variable following the same weird behavior of Signum AT variables.
* The return address register **RA**, that will be set when calling functions in same program or libraries. It is a short (two-byte) value.

## Memory
The total memory available for the programs is 256 addresses. Each address stores a 64-bit value. It is impossible to overflow the memory or access the VM program memory.

## Program
A smart contract in Signum blockchain reads each incoming message in batches of 32 bytes. Each batch will be a program code page. The instruction pointer will be always in this range from 0 to 31 in a given code page. The code pages will be limited from 0 to 30 because maximum message size in the blockchain is 1000 bytes, but the smart contracts can access only the first 992 bytes due to the batch reading behavior. Any access outside these limits will lead to program end, because reading these locations always returns zero.

## Program addresses
The calls and jumps will be referenced by a short value where the least significant byte (LSB) is the instruction pointer and the most significant byte (MSB) indicating the program code page.

## Instructions
Instruction base size is 1 byte. The base instruction will be called **opCode**. Some opCodes have bit arguments inside the opcode, they will be called 'params', so the opCode will be formed by  a **base opCode** and one or more **bit params**. Some opCodes will need additional bytes, these will be called 'arguments'.

### Param Single
Opcodes that doesn't need any param nor argument. Base opCode is 8-bit. Total size is always 1 byte.

### Param Target
Target is a 2-bit param with the type of one argument. So the base opcode is 6-bit and 2-bit are the target bit param. Target types are used to reference a variable that will be written by the instruction. Some param types will need one argument that are 1 byte long, so the total instruction size is increased. Instruction size can be 1 or 2 bytes.

| Bit param | Target | Arguments |
| --- | --- | --- |
| 00 | General use register| Not needed |
| 01 | Memory address | The memory address (unsigned) |
| 10 | Reserved | Reserved |
| 11 | Memory referenced by a memory addres | The memory address (unsigned) |

### Param Source
Base opcode is 6-bit and 2-bit are the source bit param. Source types are used to reference a variable that will be read by the instruction. Some source params will need one additional byte, so the total instruction size is increased. Instruction size can be 1 or 2 bytes.

 Bit param | Source | Additional byte |
| --- | --- | --- |
| 00 | General use register| Not needed |
| 01 | Memory address | The memory address (unsigned) |
| 10 | Immediate value | Signed byte value |
| 11 | Memory referenced by a memory address | The memory address (unsigned) |

### Param Target-Source
Here there are two params, each one is 2-bit. The base opCode will be 4-bit, then a target and a source. Both types were already described. Instruction size can be 1 to 3 bytes.

### Param Branch
The base opCode will be 5-bit, then a branch type param with 3-bit. All branch types require one argument with the offset to jump. This offset is a signed byte with the distance to jump from the next instruction. All branches decisions are taken evaluating the general use register R.

| Bit param | Branch condition |
| --- | --- |
| 000 | R == 0 |
| 001 | R != 0 |
| 010 | R > 0 |
| 011 | R < 0 |
| 100 | R >= 0 |
| 101 | R <= 0 |
| 110 | always |
| 111 | Reserved |

### Param Function
The base opCode will be 3-bit, then a function type param with 5-bit. The arguments needed will depend on each function, but each argument will always be 1 byte memory address. For all the options, please read the documentation from the SYS opCode.

[Go to SYS functions](./SYS.md)


## Instruction arguments

The following table shows the type of arguments that can be required by opCodes:

| Argument type | Data type | Size (Bytes) | Description |
| --- | --- | --- | --- |
| Memory | Unsigned byte | 1 | Memory address of one variable |
| Immediate | Signed byte | 1 | Immediate value to be used |
| Offset | Signed byte | 1 | Offset for branches |
| Short | Signed short | 2 | Value to be used in jumps or setting variables |
| Long | Signed long | 8 | Used to set variables values |


## Assembly mnemonics by class

| Class | Mnemonic | Bit params | Args | Base opCode | OpCode range | Description |
| --- | --- | --- | --- | --- | --- | --- |
| General | RST |  |  | 0x00 | 0x00 | Ends the program |
| General | NOP |  |  | 0x01 | 0x01 | No operation (padding) |
| General | JNCP |  |  | 0x02 | 0x02 | Jumps to next code page |
| General | SRA |  |  | 0xB2 | 0xB2 | R = RA |
| General | LRA |  |  | 0xB3 | 0xB3 | RA = R |
| General | SLEEP | src¹ |  | 0xF0 | 0xF0-0xF3 | Stops contract execution and resumes after source blocks |
| Operation | SET | trg, src¹ |  | 0x10 | 0x10-0x1F | trg = src |
| Operation | ADD | trg, src¹ |  | 0x20 | 0x20-0x2F | trg += src |
| Operation | SUB | trg, src¹ |  | 0x30 | 0x30-0x3F | trg -= src |
| Operation | MUL | trg, src¹ |  | 0x40 | 0x40-0x4F | trg *= src |
| Operation | DIV | trg, src¹ |  | 0x50 | 0x50-0x5F | trg /= src |
| Operation | OR | trg, src¹ |  | 0x60 | 0x60-0x6F | trg \|= src |
| Operation | XOR | trg, src¹ |  | 0x70 | 0x70-0x7F | trg ^= src |
| Operation | SHL | trg, src¹ |  | 0x80 | 0x80-0x8F | trg <<= src |
| Operation | SHR | trg, src¹ |  | 0x90 | 0x90-0x9F | trg >>= src |
| Operation | AND | trg, src¹ |  | 0xA0 | 0xA0-0xAF | trg &= src |
| Operation | NOT | trg |  | 0xF4 | 0xF4-0xF7 | trg = ~trg |
| Operation | SET16 | trg | short | 0xF8 | 0xF8-0xFB | Sets target to the 16-bit argument (to be casted to signed long) |
| Operation | SET64 | trg | long | 0xFC | 0xFC-0xFF | Sets target to the 64-bit argument |
| Branch | BZ | brch | offset | 0xB8 | 0xB8 | Jump to offset if R == 0 |
| Branch | BNZ | brch | offset | 0xB8 | 0xB9 | Jump to offset if R != 0 |
| Branch | BGZ | brch | offset | 0xB8 | 0xBA | Jump to offset if R > 0 |
| Branch | BLZ | brch | offset | 0xB8 | 0xBB | Jump to offset if R < 0 |
| Branch | BGEZ | brch | offset | 0xB8 | 0xBC | Jump to offset if R >= 0 |
| Branch | BLEZ | brch | offset | 0xB8 | 0xBD | Jump to offset if R <= 0 |
| Branch | BA | brch | offset | 0xB8 | 0xBE | Jump always. Short form for JMP if label is reachable by offset. |
| Jump | RET |  |  | 0xB0 | 0xB0 | Return to RA address in same program |
| Jump | RETLIB |  |  | 0xB1 | 0xB1 | Return to RA address in program stored in R |
| Jump | JMP |  | short | 0xB4 | 0xB4 | Jumps to the argument address |
| Jump | CALL |  | short | 0xB5 | 0xB5 | Call the function at argument address, storing the returning address in RA |
| Jump | EXEC |  | short | 0xB6 | 0xB6 | Call the function at argument address in the program at R, storing the returning address in RA. After call the R will be set to the caller program. |
| Jump | HARA |  | short | 0xB7 | 0xB7 | **H**alt program **A**nd **R**estart **A**t argument address on next activation. |
| System | SYS | func | N*memAdr | 0xC0 | 0xC0-0xDF | Number of arguments is dependent of func type. |
| Reserved |  |  |  |  | 0xE0-0xEF |  |

1) If source is immediate, the signed byte argument is casted to signed long before the operation.

## Assembly syntax

Go to [assembly syntax](./Assembly-syntax.md)
