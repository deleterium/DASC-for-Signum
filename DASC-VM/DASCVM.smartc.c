#program name DASCVM
#program description VM contract to run DASC program. Revision 0.
#program activationAmount 1.5

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
long *pArg1, *pArg2, *pArg3, *pArg4, *pArg5;
long arg1, arg2;
long codeCache; //instruction cache
long codeCacheReady; //instruction cache
long codeAddr;

long shift, retVal; // getByte, getShort and getLong

long txId; // Current transaction ID
long creator = getCreator();

struct STATS {
    long running,
        steps,
        programs;
} stats;

void main () {
    while ((txId = getNextTx()) != 0) {
        // get details
        if (getSender(txId) != creator) {
            continue;
        }
        stats.running = true;
        ++stats.programs;
        VSC = txId;
        CIP = 0;
        CPG = 0;
        loadedCPG = -1;
        codeCacheReady = false;
        do {
            opCode = getByte();
            lowOpCode = opCode & 0xF;
            hiOpCode = opCode >> 4;
            executeInstruction();
            ++stats.steps;
        } while (opCode);
        stats.running = false;
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
        codeCacheReady = false;
        return;
    default:
        // Reserved
        return;
    }
}

void execHiOpCode1toA() {
    pArg1 = getTarget((opCode >> 2) & 0x03);
    arg2 = getSource(opCode & 0x03);
    
    if (hiOpCode < 0x6) {
        switch (hiOpCode) {
        case 0x1: // 0x10 SET
            *pArg1 = arg2;
            return;
        case 0x2: // 0x20 ADD
            *pArg1 += arg2;
            return;
        case 0x3: // 0x30 SUB
            *pArg1 -= arg2;
            return;
        case 0x4: // 0x40 MUL
            *pArg1 *= arg2;
            return;
        default:  // 0x50 DIV
            *pArg1 /= arg2;
            return;
        }
    }
    switch (hiOpCode) {
    case 0x6: // 0x60 OR
        *pArg1 |= arg2;
        return;
    case 0x7: // 0x70 XOR
        *pArg1 ^= arg2;
        return;
    case 0x8: // 0x80 SHL
        *pArg1 <<= arg2;
        return;
    case 0x9: // 0x90 SHR
        *pArg1 >>= arg2;
        return;
    default:  // 0xA0 AND
        *pArg1 &= arg2;
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
        codeCacheReady = false;
        return;
    }
    if (lowOpCode >= 0x4) {
        codeAddr = getShort();
        switch (lowOpCode) {
        case 0x4: // 0xB4 JMP
            jumpTo(codeAddr);
            return;
        case 0x5: // 0xB5 CALL
            RA = CPG << 8 | CIP;
            jumpTo(codeAddr);
            return;
        case 0x6: // 0xB6 EXEC
            RA = CPG << 8 | CIP;
            jumpTo(codeAddr);
            // swap R and VSC
            R ^= VSC;
            VSC ^= R;
            R ^= VSC;
            syncCodePage();
            return;         
        default:  // 0xB7 HARA
            jumpTo(codeAddr);
            halt;
            return;
        }
    }
    // low opCode is lower than 4
    if (lowOpCode == 0x0) { // 0xB0 RET
        jumpTo(RA);
        return;
    }
    if (lowOpCode == 0x1) { // 0xB1 RETLIB
        jumpTo(RA);
        // swap R and VSC
        R ^= VSC;
        VSC ^= R;
        R ^= VSC;
        syncCodePage();
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

    pArg1 = getTarget(opCode & 0x03);
    if (lowOpCode >= 0xC) { // 0xFC SET64
        *pArg1 = getLong();
        return;
    }
    if (lowOpCode >= 0x8) { // 0xF8 SET16
        *pArg1 = getShort();
        return;
    }
    // 0xF4 NOT
    *pArg1 = ~*pArg1;
    return;
}

// SYS matches 0xC and 0xD hiOpCode
void execSYS(long func) {
    pArg1 = getTarget(1);
    if (func < 0x07) {
        if (func < 0x03) {
            switch (func) {
            case 0x00: // getTxLoopTimestamp
                *pArg1 = _counterTimestamp;
                return;
            case 0x01: // setTxLoopTimestamp
                _counterTimestamp = *pArg1;
                return;
            default: // 0x02
                sendBalance(*pArg1);
                return;
            }
        }
        switch (func) {
        case 0x03:
            *pArg1 = getCurrentBlockheight();
            return;
        case 0x04:
            *pArg1 = getWeakRandomNumber();
            return;
        case 0x05: // getCreator
            *pArg1 = creator;
            return;
        default:  // 0x06
            *pArg1 = getCurrentBalance();
            return;
        }
    }
    pArg2 = getTarget(1);
    arg2 = *pArg2;
    if (func < 0x0E) {
        if (func < 0x0B) {
            switch (func) {
            case 0x08:
                *pArg1 = getAmount(arg2);
                return;
            case 0x09:
                *pArg1 = getSender(arg2);
                return;
            case 0x07:
                *pArg1 = getBlockheight(arg2);
                return;
            default: // 0x0A
                *pArg1 = getType(arg2);
                return;
            }
        }
        switch (func) {
        case 0x0C:
            sendAmount(*pArg1, arg2);
            return;
        case 0x0D:
            sendMessage(pArg1, arg2);
            return;
        default: // 0x0B:
            readAssets(*pArg1, pArg2);
            return;
        }
    }
    if (func < 0x14) {
        // Using lowOpCode to optimize the code
        switch (lowOpCode) {
        case 0xE: // func 0x0E
            *pArg1 = getCreatorOf(arg2);
            return;
        case 0xF: // func 0x1F
            *pArg1 = getCodeHashOf(arg2);
            return;
        case 0x0: // func 0x10
            *pArg1 = getActivationOf(arg2);
            return;
        case 0x1: // func 0x11
            *pArg1 = getAssetBalance(arg2);
            return;
        case 0x2: // func 0x12
            mintAsset(*pArg1, arg2);
            return;
        default: // lowOpCode 0x3 :: func 0x13
            *pArg1 = getAssetCirculating(arg2);
            return;
        }
    }
    pArg3 = getTarget(1);
    if (func < 0x1C) {
        if (func < 0x18) {
        switch (lowOpCode) {
            case 0x4: // func 0x14 getNextTxDetails
                txId = getNextTx();
                if (txId == 0) {
                    *pArg1 = 0;
                    *pArg2 = 0;
                    *pArg3 = 0;
                    return;
                }
                *pArg3 = getAmount(txId);
                *pArg2 = getSender(txId);
                *pArg1 = txId;
                return;
            case 0x5: // func 0x15
                readMessage(*pArg1, arg2, pArg3);
                return;
            case 0x6: // func 0x16
                *pArg1 = getQuantity(arg2, *pArg3);
                return;
            default: // lowOpCode 0x7 :: func 0x17
                sendAmountAndMessage(*pArg1, pArg2, *pArg3);
                return;
            }
        }
        switch (lowOpCode) {
        case 0x8: // func 0x18
            sendQuantity(*pArg1, arg2, *pArg3);
            return;
        case 0x9: // func 0x19
            setMapValue(*pArg1, arg2, *pArg3);
            return;
        case 0xA: // func 0x1A
            *pArg1 = getMapValue(arg2, *pArg3);
            return;
        default: // lowOpCode 0xB :: func 0x1B
            *pArg1 = getAssetHoldersCount(arg2, *pArg3);
            return;
        }
    }
    pArg4 = getTarget(1);
    if (func < 0x1F) {
        switch (lowOpCode) {
        case 0xC: // func 0x1C
            sendQuantityAndAmount(*pArg1, arg2, *pArg3, *pArg4);
            return;
        case 0xD: // func 0x1D
            *pArg1 = getExtMapValue(arg2, *pArg3, *pArg4);
            return;
        default: // lowOpCode 0xE :: func 0x1E
            *pArg1 = issueAsset(arg2, *pArg3, *pArg4);
            return;
        }
    }
    // Only 0x1F remaining
    pArg5 = getTarget(1);
    distributeToHolders(*pArg1, arg2, *pArg3, *pArg4, *pArg5);
}

long *getTarget(long type) {
    if (type == 0x00) { // Register
        return &R;
    }
    if (type == 0x01) { // Memory
        return VMM + getByte();
    }
    // 0x02 is not  used
    // type is 0x03 Content Of Memory
    return VMM + (VMM[getByte()] & 0xFF);
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
    if (codeCacheReady) {
        codeCache >>= 8;
    } else {
        if (loadedCPG != CPG) {
            syncCodePage();
        }
        codeCache = codePage[CIP / 8];
        shift = (CIP % 8) * 8;
        codeCache >>= shift;
        codeCacheReady = true;
    }
    CIP++;
    if (CIP == 32) {
        CIP = 0;
        CPG++;
    }
    if (CIP % 8 == 0) {
        codeCacheReady = false;
    }
    return codeCache & 0xFF;
}

long getShort() {
    if (loadedCPG != CPG) {
        syncCodePage();
    }
    shift = (CIP % 8) * 8;
    retVal = codePage[CIP / 8] >> shift;
    CIP += 2;
    if (CIP >= 32) {
        CIP %= 32;
        CPG++;
    }
    if (shift == 56) {
        if (loadedCPG != CPG) {
            syncCodePage();
        }
        retVal |= codePage[CIP / 8] << 8;
    }
    retVal &= 0xFFFF;
    if (retVal > 0x7FFF) {
        retVal -= 0x10000;
    }
    codeCacheReady = false;
    return retVal;
}

long getLong() {
    if (loadedCPG != CPG) {
        syncCodePage();
    }
    shift = (CIP % 8) * 8;
    retVal = codePage[CIP / 8] >> shift;
    CIP += 8;
    if (CIP >= 32) {
        CIP %= 32;
        CPG++;
    }
    if (shift) {
        if (loadedCPG != CPG) {
            syncCodePage();
        }
        retVal |= codePage[CIP / 8] << (64 - shift);
    }
    codeCacheReady = false;
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
    codeCacheReady = false;
}

void syncCodePage() {
    readMessage(VSC, CPG, codePage);
    loadedCPG = CPG;
}

void jumpTo(long codeAddr) {
    CIP = codeAddr & 0xFF;
    CPG = codeAddr >> 8;
    codeCacheReady = false;
}