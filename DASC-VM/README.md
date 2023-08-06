# VM contract to run DASC programs

This VM smart contract was developed using SmartC Compiler for Signum. It is designed to execute transactions from the creator and disregard transactions from any other account.

## Usage

Deploy the contract and it will follow all instructions sent by creator's binary messages. These messages shall be machine code in DASC format, they are called Very Smart Contracts or VSC. The VSC can use almost all features from Signum AT Code. Currently it was not implemented the special operations with A and B super-registers, only the regular built-in functions from SmartC. Use other tools to create the VSC, currently only DASC Assembler available.

## Possible use cases

DASC was created as a conceptual project, showing that it is possible to run smart contracts inside smart contracts. It can be useful in some situations:
* Creating a smart contract that can be remotely controlled to do anything.
* Creating a VSC that can runs just like a regular smart contract processing transactions, but can be updated by the creator.

## Status
Currently in beta, running tests and subject to change.

## Source code

Keep in mind that Signum bytecode does not allow to create jump tables neither jump to arbitrary addresses (like creating a function's table). So the opCode processing should be an arcaic 'nested ifs' and I'm trying to balance them.

[Revision 0](./DASCVM.0.smartc.c)
