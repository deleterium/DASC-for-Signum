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

```c
#program name DASCVM
#program description VM contract to run DASC program. Code version beta.
#program activationAmount 1.0

#pragma maxConstVars 10
#pragma version 2.1
#pragma verboseAssembly
#pragma optimizationLevel 3

const long n11 = 11, n12 = 12, n13 = 13, n14=14, n15=15;
const long n32 = 32, n127 = 127, n255 = 255;

long RA; // The Return Address
long R; // The Register
long VMM[256]; // Virtual Machine Memory

long VSC; // Current Very Smart Contract
long CIP; // Current Instruction Pointer (0 to 31)
long CPG; // Current Page (0 to 30)
long loadedCPG;
long codePage[4]; // Current code page
long opCode, hiOpCode, lowOpCode;
long codeAddr;

long shift, retVal; // getByte, getShort and getLong

long txId; // Current transaction ID
long creator = getCreator();

void main () {
    while ((txId = getNextTx()) != 0) {
        // get details
        if (getSender(txId) != creator) {
            continue;
        }
        VSC = txId;
        CIP = 0;
        CPG = 0;
        loadedCPG = -1;
        do {
            opCode = getByte();
            lowOpCode = opCode & 0xF;
            hiOpCode = opCode >> 4;
            executeInstruction();
        } while (opCode);
    }
}


void executeInstruction(void) {
    if (hiOpCode < 0xB) {
        if (hiOpCode == 0x0) {
            execHiOpCode0();
            return;
        }
        // hiOpCode <= 0xA)
        execHiOpCode1toA();
        return;
    }
    if (hiOpCode <= 0xD) {
        if (hiOpCode == 0xB) {
            execHiOpCodeB();
            return;
        }
        // hiOpCode is 0xC or 0xD) Matches only SYS opCode
        execSYS(opCode & 0x1F);
        return;
    }
    if (hiOpCode == 0xF) {
        execHiOpCodeF();
        return;
    }
    // matches reserved 0xE hiOpCode
}

void execHiOpCode0() {
    switch (lowOpCode) {
    case 0x0: // 0x00 RST
    case 0x1: // 0x01 NOP
        return;
    case 0x2: // 0x02 JNCP
        CIP = 0;
        CPG++;
        return;
    default:
        // Reserved
        return;
    }
}

void execHiOpCode1toA() {
    long *pTarget = getTarget((opCode >> 2) & 0x03);
    long source = getSource(opCode & 0x03);
    
    if (hiOpCode < 0x6) {
        switch (hiOpCode) {
        case 0x1: // 0x10 SET
            *pTarget = source;
            return;
        case 0x2: // 0x20 ADD
            *pTarget += source;
            return;
        case 0x3: // 0x30 SUB
            *pTarget -= source;
            return;
        case 0x4: // 0x40 MUL
            *pTarget *= source;
            return;
        default:  // 0x50 DIV
            *pTarget /= source;
            return;
        }
    }
    switch (hiOpCode) {
    case 0x6: // 0x60 OR
        *pTarget |= source;
        return;
    case 0x7: // 0x70 XOR
        *pTarget ^= source;
        return;
    case 0x8: // 0x80 SHL
        *pTarget <<= source;
        return;
    case 0x9: // 0x90 SHR
        *pTarget >>= source;
        return;
    default:  // 0xA0 AND
        *pTarget &= source;
        return;
    }
}

void execHiOpCodeB() {
    if (lowOpCode >= 0x8) {
        // Branches: 0xB8 <= opcode <= 0xBF
        long brch = opCode & 0x7;
        if ((brch == 0x0 && R == 0) ||
            (brch == 0x1 && R != 0) ||
            (brch == 0x2 && R > 0) ||
            (brch == 0x3 && R < 0) ||
            (brch == 0x4 && R >= 0) ||
            (brch == 0x5 && R <= 0) ||
            (brch == 0x6)) {
            advanceOffset(getByte());
            return;
        }
        CIP++;
        if (CIP == 32) {
            CIP = 0;
            CPG++;
        }        
        return;
    }
    if (lowOpCode >= 0x4) {
        codeAddr = getShort();
        switch (lowOpCode) {
        case 0x4: // 0xB4 JMP
            CIP = codeAddr & 0xFF;
            CPG = codeAddr >> 8;
            return;
        case 0x5: // 0xB5 CALL
            RA = CPG << 8 | CIP;
            CIP = codeAddr & 0xFF;
            CPG = codeAddr >> 8;
            return;
        case 0x6: // 0xB6 EXEC
            RA = CPG << 8 | CIP;
            CIP = codeAddr & 0xFF;
            CPG = codeAddr >> 8;
            // swap R and VSC
            R ^= VSC;
            VSC ^= R;
            R ^= VSC;
            readMessage(VSC, CPG, codePage);
            loadedCPG = CPG;
            return;         
        default:  // 0xB7 HARA
            CIP = codeAddr & 0xFF;
            CPG = codeAddr >> 8;
            halt;
            return;
        }
    }
    // low opCode is lower than 4
    if (lowOpCode == 0x0) { // 0xB0 RET
        CIP = RA & 0xFF;
        CPG = RA >> 8;
        return;
    }
    if (lowOpCode == 0x1) { // 0xB1 RETLIB
        CIP = RA & 0xFF;
        CPG = RA >> 8;
        // swap R and VSC
        R ^= VSC;
        VSC ^= R;
        R ^= VSC;
        readMessage(VSC, CPG, codePage);
        loadedCPG = CPG;
        return;
    }
    if (lowOpCode == 0x2) { // 0xB2 SRA
        R = RA;
        return;
    }
    // 0xB3 LRA
    RA = R;
    return;
}

void execHiOpCodeF(void) {
    if (lowOpCode < 0x4) { // 0xF0 SLEEP
        sleep getSource(opCode & 0x03);
        return;
    }

    long *pTarget = getTarget(opCode & 0x03);
    if (lowOpCode >= 0xC) { // 0xFC SET64
        *pTarget = getLong();
        return;
    }
    if (lowOpCode >= 0x8) { // 0xF8 SET16
        *pTarget = getShort();
        return;
    }
    // 0xF4 NOT
    *pTarget = ~*pTarget;
    return;
}

// SYS matches 0xC and 0xD hiOpCode
void execSYS(long func) {
    long *pArg1, *pArg2, *pArg3, *pArg4, *pArg5;
    long arg2;
    pArg1 = getTarget(1);
    if (func < 0x08) {
        switch (func) {
        case 0x00:
            *pArg1 = getNextTx();
            return;
        case 0x01: // getTxLoopTimestamp
            *pArg1 = _counterTimestamp;
            return;
        case 0x02: // setTxLoopTimestamp
            _counterTimestamp = *pArg1;
            return;
        case 0x03:
            sendBalance(*pArg1);
            return;
        case 0x04:
            *pArg1 = getCurrentBlockheight();
            return;
        case 0x05:
            *pArg1 = getWeakRandomNumber();
            return;
        case 0x06:
            // *pArg1 = getCreator();
            *pArg1 = creator;
            return;
        default:  // 0x07
            *pArg1 = getCurrentBalance();
            return;
        }
    }
    pArg2 = getTarget(1);
    arg2 = *pArg2;
    if (func < 0x0F) {
        switch (func) {
        case 0x08:
            *pArg1 = getBlockheight(arg2);
            return;
        case 0x09:
            *pArg1 = getAmount(arg2);
            return;
        case 0x0A:
            *pArg1 = getSender(arg2);
            return;
        case 0x0B:
            *pArg1 = getType(arg2);
            return;
        case 0x0C:
            readAssets(*pArg1, pArg2);
            return;
        case 0x0D:
            sendAmount(*pArg1, arg2);
            return;
        default: // 0x0E
            sendAmount(*pArg1, arg2);
            return;
        }
    }
    if (func < 0x15) {
        switch (func) {
        case 0x0F:
            *pArg1 = getCreatorOf(arg2);
            return;
        case 0x10:
            *pArg1 = getCodeHashOf(arg2);
            return;
        case 0x11:
            *pArg1 = getActivationOf(arg2);
            return;
        case 0x12:
            *pArg1 = getAssetBalance(arg2);
            return;
        case 0x13:
            mintAsset(*pArg1, arg2);
            return;
        default: // 0x14
            *pArg1 = getAssetCirculating(arg2);
            return;
        }
    }
    pArg3 = getTarget(1);
    if (func < 0x1C) {
        switch (func) {
        case 0x15:
            readMessage(*pArg1, arg2, pArg3);
            return;
        case 0x16:
            *pArg1 = getQuantity(arg2, *pArg3);
            return;
        case 0x17:
            sendAmountAndMessage(*pArg1, pArg2, *pArg3);
            return;
        case 0x18:
            sendQuantity(*pArg1, arg2, *pArg3);
            return;
        case 0x19:
            setMapValue(*pArg1, arg2, *pArg3);
            return;
        case 0x1A:
            *pArg1 = getMapValue(arg2, *pArg3);
            return;
        default: // 0x1B
            *pArg1 = getAssetHoldersCount(arg2, *pArg3);
            return;
        }
    }
    pArg4 = getTarget(1);
    if (func < 0x1F) {
        switch (func) {
        case 0x1C:
            sendQuantityAndAmount(*pArg1, arg2, *pArg3, *pArg4);
            return;
        case 0x1D:
            *pArg1 = getExtMapValue(arg2, *pArg3, *pArg4);
            return;
        default: // 0x1E
            *pArg1 = issueAsset(arg2, *pArg3, *pArg4);
            return;
        }
    }
    // Only 0x1F remaining
    pArg5 = getTarget(1);
    distributeToHolders(*pArg1, arg2, *pArg3, *pArg4, *pArg5);
    return;
}

long *getTarget(long type) {
    if (type == 0x00) { // Register
        return &R;
    }
    long b = getByte();
    if (type == 0x01) { // Memory
        return VMM + b;
    }
    // 0x02 is not  used
    // type is 0x03 Content Of Memory
    return VMM + (VMM[b] & 0xFF);
}

long getSource(long type) {
    if (type == 0x00) { // Register
        return R;
    }
    long b = getByte();
    switch (type) {
    case 0x01: // Memory
        return VMM[b];
    case 0x02: // Immediate
        if (b > 0x7F) {
            b -= 0x100;
        }
        return b;
    default: // 0x03 Content Of Memory
        return VMM[VMM[b] & 0xFF];
    }
}

long getByte() {
    ensureCodePage();
    long buffer = codePage[CIP / 8];
    shift = (CIP % 8) * 8;
    CIP++;
    if (CIP == 32) {
        CIP = 0;
        CPG++;
    }        
    return (buffer >> shift) & 0xFF;
}

long getShort() {
    ensureCodePage();
    shift = (CIP % 8) * 8;
    retVal = codePage[CIP / 8] >> shift;
    CIP += 2;
    if (CIP >= 32) {
        CIP %= 32;
        CPG++;
    }
    if (shift == 56) {
        ensureCodePage();
        retVal |= codePage[CIP / 8] << 8;
    }
    retVal &= 0xFFFF;
    if (retVal > 0x7FFF) {
        retVal -= 0x10000;
    }
    return retVal;
}

long getLong() {
    ensureCodePage();
    shift =  (CIP % 8) * 8;
    retVal = codePage[CIP / 8] >> shift;
    CIP += 8;
    if (CIP >= 32) {
        CIP %= 32;
        CPG++;
    }
    if (shift) {
        ensureCodePage();
        retVal |= codePage[CIP / 8] << (64 - shift);
    }
    return retVal;
}

// Advances CIP and CPG by an offset between -128 and +127.
void advanceOffset(long offset) {
    if (offset > 0x7F) {
        offset -= 0x100;
    }
    CPG += offset / 32;
    CIP += offset % 32;
    if (CIP < 0) {
        CPG--;
        CIP += 32;
    }
    if (CIP >= 32) {
        CPG++;
        CIP -= 32;
    }
}

void ensureCodePage() {
    if (loadedCPG == CPG) {
        return;
    }
    readMessage(VSC, CPG, codePage);
    loadedCPG = CPG;
}
```
