#program name DASCVM
#program description VM contract to run DASC program. Revision 1.
#program activationAmount 2_0000_0000

#pragma maxConstVars 10
#pragma version 2.3
#pragma verboseAssembly
#pragma optimizationLevel 3
#pragma maxAuxVars 5

const long n11 = 11, n12 = 12, n13 = 13, n14=14, n15=15;
const long n32 = 32, n127 = 127, n255 = 255;

long RA; // The Return Address
long R; // The Register
long VMM[256]; // Virtual Machine Memory

long CIP; // Current Instruction Pointer (0 to 2048)
long opCode, hiOpCode, lowOpCode, opCache;
long *pArg1, *pArg2, *pArg3, *pArg4, *pArg5;
long arg1, arg2;

long txId; // Current transaction ID. Can track current program in execution.
long creator = getCreator();

struct STATS {
    long running,
        steps,
        programs;
} stats;

struct HEADER {
    long magic,
        IDpages,
        NIDpages,
        programSize,
        clearNID;
} header;

// Ensure all variables are initialized
const stats.running = 0;
const stats.steps = 0;
const stats.programs = 0;
const header.magic = 0;
const header.IDpages = 0;
const header.NIDpages = 0;
const header.programSize = 0;
const header.clearNID = 0;

void main () {
    while ((txId = getNextTx()) != 0) {
        // get details
        if (getSender(txId) != creator) {
            continue;
        }
        if (loadProgram() != 0) {
            continue;
        }
        stats.running = true;
        ++stats.programs;
        if (header.NIDpages + header.IDpages == 0) {
            CIP = 8;
        } else {
            CIP = 32 * (header.NIDpages + header.IDpages);
        }
        R = 0;
        RA = 0;
        do {
            if (CIP & 0xfffffffffffff800) {
                // Reset VSC if CIP < 0 or CIP > 2047
                break;
            }
            opCache = getLong();
            CIP -= 7; // Advance only one instruction
            opCode = opCache & 0xFF;
            lowOpCode = opCode & 0xF;
            hiOpCode = opCode >> 4;
            executeInstruction();
            ++stats.steps;
        } while (opCode);
        stats.running = false;
    }
}

inline void processRawHeader(void) {
    register long rawHeader = VMM[0];
    header.magic = rawHeader & 0xFFFFFFFF;
    rawHeader >>= 32;
    header.IDpages = rawHeader & 0xFF;
    rawHeader >>= 8;
    header.NIDpages = rawHeader & 0xFF;
    rawHeader >>= 8;
    header.programSize = rawHeader & 0xFF;
    rawHeader >>= 8;
    header.clearNID = rawHeader;
}

long loadProgram(void) {
    readMessage(txId, 0, VMM);
    processRawHeader();
    if (header.magic != "VSC1") {
        return 1;
    }
    if (header.programSize == 0) {
        txId = VMM[1];
        return loadProgram();
    }
    register long programPage = 1, messagePage = 1;
    for (; programPage < header.programSize; programPage++) {
        if (programPage >= header.IDpages && programPage < header.IDpages + header.NIDpages) {
            if (header.clearNID) {
                register long vmmIdx = programPage * 4;
                VMM[vmmIdx] = 0; vmmIdx++;
                VMM[vmmIdx] = 0; vmmIdx++;
                VMM[vmmIdx] = 0; vmmIdx++;
                VMM[vmmIdx] = 0; vmmIdx++;
            }
            continue;
        }
        readMessage(txId, messagePage, VMM + 4* programPage);
        messagePage++;
    }
    return 0;
}

void executeInstruction(void) {
    if (hiOpCode < 0xB) {
        if (hiOpCode == 0x0) {
            // 0x00 RST
            // 0x01 NOP
            // 0x02 to 0x0F Reserved
            return;
        }
        // hiOpCode <= 0xA)
        execHiOpCode1toAandE();
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
    // matches 0xE hiOpCode
    execHiOpCode1toAandE();
}

void execHiOpCode1toAandE() {
    pArg1 = getTarget((opCode >> 2) & 0x03);
    arg2 = getSource(opCode & 0x03);
    
    if (hiOpCode < 0x6) {
        switch (hiOpCode) {
        case 0x1: // 0x10 SET
            *pArg1 = arg2;
            return;
        case 0x3: // 0x30 SUB
            *pArg1 -= arg2;
            return;
        case 0x2: // 0x20 ADD
            *pArg1 += arg2;
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
    case 0x7: // 0x70 XOR
        *pArg1 ^= arg2;
        return;
    case 0x6: // 0x60 OR
        *pArg1 |= arg2;
        return;
    case 0x8: // 0x80 SHL
        *pArg1 <<= arg2;
        return;
    case 0x9: // 0x90 SHR
        *pArg1 >>= arg2;
        return;
    case 0xA: // 0xA0 AND
        *pArg1 &= arg2;
        return;
    default:  // 0xE0 MOD
        *pArg1 %= arg2;
    }
}

void execHiOpCodeB() {
    if (lowOpCode >= 0x8) {
        // Branches: 0xB8 <= opcode <= 0xBF
        long brch = opCode & 0x7;
        if (brch == 0x7) {
            long params = getCachedByte();
            brch = params >> 4;
            if (brch < 0x6) {
                arg1 = getSource((params >> 2) & 0x3) - getSource(params & 0x3);
            } else {
                brch -= 6;
                arg1 = getSource(params & 0x3);
            }
            R = arg1;
        }
        if ((brch == 0x0 && R == 0) ||
            (brch == 0x1 && R != 0) ||
            (brch == 0x2 && R > 0) ||
            (brch == 0x3 && R < 0) ||
            (brch == 0x4 && R >= 0) ||
            (brch == 0x5 && R <= 0) ||
            (brch == 0x6)) {
            // advanceOffset
            register long offset = getCachedByte();
            if (offset > 0x7F) {
                offset -= 0x100;
            }
            CIP += offset;
            return;
        }
        CIP++;
        return;
    }
    if (lowOpCode >= 0x4) {
        register long codeAddr = getCachedShort();
        switch (lowOpCode) {
        case 0x4: // 0xB4 JMP
            CIP = codeAddr;
            return;
        case 0x5: // 0xB5 CALL
            RA = CIP;
            CIP = codeAddr;
            return;
        case 0x6: // 0xB6 Reserved
            return;         
        default:  // 0xB7 HARA
            CIP = codeAddr;
            halt;
            return;
        }
    }
    // low opCode is lower than 4
    if (lowOpCode == 0x0) { // 0xB0 RET
        CIP = RA;
        return;
    }
    if (lowOpCode == 0x1) { // 0xB1 JMPR
        CIP = R;
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
        *pArg1 = getCachedShort();
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
        return VMM + getCachedByte();
    }
    // 0x02 is not  used
    // type is 0x03 Content Of Memory
    return VMM + (VMM[getCachedByte()] & 0xFF);
}

long getSource(long type) {
    if (type == 0x00) { // Register
        return R;
    }
    register long b = getCachedByte();
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

long getCachedByte(void) {
    opCache >>= 8;
    CIP++;
    return opCache & 0xFF;
}

long getCachedShort(void) {
    opCache >>= 8;
    register long retVal = opCache & 0xFFFF;
    opCache >>= 8;
    CIP += 2;
    if (retVal > 0x7FFF) {
        retVal -= 0x10000;
    }
    return retVal;
}

long getLong(void) {
    register long shift = (CIP % 8) * 8;
    register long retVal = VMM[CIP / 8] >> shift;
    CIP += 8;
    if (shift) {
        retVal |= VMM[CIP / 8] << (64 - shift);
    }
    return retVal;
}
