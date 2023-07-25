"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/DASC-for-Signum
// License: GLP-3.0

function assembler(assembly_source) {

    const dvscAsmSpec = {
        op_code_table: [
            { op_code: 0x100, name: "blank", size:0, args_type: "",regex: /^\s*$/},
            { op_code: 0x101, name: "label", size:0, args_type: "",regex: /^\s*(\w+):\s*$/},
            { op_code: 0x102, name: "adr", size:0, args_type: "",regex: /^\s*.adr\s+(\w+)\s+(\w+)\s*$/},
            { op_code: 0x103, name: "define", size:0, args_type: "",regex: /^\s*.define\s+(\w+)\s+(\w+)\s*$/},
            { op_code: 0x104, name: "functionInfo", size:0, args_type: "",regex: /^\s*.functionInfo\s+(\w+)(.*)$/},
            { op_code: 0x105, name: "startingAddress", size:0, args_type: "",regex: /^\s*.startingAddress\s+(\w+)\s*$/},
            { op_code: 0x02, name: "alignCodePage", size:1, args_type: "",regex: /^\s*.alignCodePage\s*$/},
            { op_code: 0x00, name: "RST", size: 1, args_type: "",regex: /^\s*RST\s*$/},
            { op_code: 0x01, name: "NOP", size: 1, args_type: "",regex: /^\s*NOP\s*$/},
            { op_code: 0x02, name: "JNCP", size: 1, args_type: "",regex: /^\s*JNCP\s*$/},
            { op_code: 0x10, name: "SET", size:1, args_type: "US", regex: /^\s*SET\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x20, name: "ADD", size:1, args_type: "US", regex: /^\s*ADD\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x30, name: "SUB", size:1, args_type: "US", regex: /^\s*SUB\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x40, name: "MUL", size:1, args_type: "US", regex: /^\s*MUL\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x50, name: "DIV", size:1, args_type: "US", regex: /^\s*DIV\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x60, name: "OR",size:1, args_type: "US", regex: /^\s*OR\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x70, name: "XOR", size:1, args_type: "US", regex: /^\s*XOR\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x80, name: "SHL", size:1, args_type: "US", regex: /^\s*SHL\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0x90, name: "SHR", size:1, args_type: "US", regex: /^\s*SHR\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0xA0, name: "AND", size:1, args_type: "US", regex: /^\s*AND\s+(\$|[*]?\w+)\s*,\s*(\$|[*-]?\w+)\s*$/},
            { op_code: 0xB0, name: "RET", size:1, args_type: "", regex: /^\s*RET\s*$/},
            { op_code: 0xB1, name: "RETLIB", size:1, args_type: "", regex: /^\s*RETLIB\s*$/},
            { op_code: 0xB2, name: "SRA", size:1, args_type: "", regex: /^\s*SRA\s*$/},
            { op_code: 0xB3, name: "LRA", size:1, args_type: "", regex: /^\s*LRA\s*$/},
            { op_code: 0xB4, name: "JMP", size:1, args_type: "J", regex: /^\s*JMP\s+(\w+)\s*$/},
            { op_code: 0xB5, name: "CALL", size:1, args_type: "J", regex: /^\s*CALL\s+(\w+)\s*$/},
            { op_code: 0xB6, name: "EXEC", size:1, args_type: "s", regex: /^\s*EXEC\s+(\w+)\s*$/},
            { op_code: 0xB7, name: "HARA", size:1, args_type: "J", regex: /^\s*HARA\s+(\w+)\s*$/},
            { op_code: 0xB8, name: "BZ", size:1, args_type: "B", regex: /^\s*BZ\s+(\w+)\s*$/},
            { op_code: 0xB9, name: "BNZ", size:1, args_type: "B", regex: /^\s*BNZ\s+(\w+)\s*$/},
            { op_code: 0xBA, name: "BGZ", size:1, args_type: "B", regex: /^\s*BGZ\s+(\w+)\s*$/},
            { op_code: 0xBB, name: "BLZ", size:1, args_type: "B", regex: /^\s*BLZ\s+(\w+)\s*$/},
            { op_code: 0xBC, name: "BGEZ", size:1, args_type: "B", regex: /^\s*BGEZ\s+(\w+)\s*$/},
            { op_code: 0xBD, name: "BLEZ", size:1, args_type: "B", regex: /^\s*BLEZ\s+(\w+)\s*$/},
            { op_code: 0xBE, name: "BA", size:1, args_type: "B", regex: /^\s*BA\s+(\w+)\s*$/},
            { op_code: 0xC0, name: "SYS", size:1, args_type: "F", regex: /^\s*SYS\s+(\w+)(.*)$/},
            { op_code: 0xF0, name: "SLEEP", size: 1, args_type: "S",regex: /^\s*SLEEP\s+(\$|[*]?\w+)\s*$/},
            { op_code: 0xF4, name: "NOT", size:1, args_type: "T",regex: /^\s*NOT\s+(\$|[*]?\w+)\s*$/},
            { op_code: 0xF8, name: "SET16", size:1, args_type: "Ts", regex: /^\s*SET16\s+(\$|[*]?\w+)\s*,\s*(-?\w+)\s*$/},
            { op_code: 0xFC, name: "SET64", size:1, args_type: "Tl", regex: /^\s*SET64\s+(\$|[*]?\w+)\s*,\s*(-?\w+)\s*$/}
        ],
        sys_code_table: [
            { name: "getNextTx", func_code: 0x00, args: 1 },
            { name: "getTxLoopTimestamp", func_code: 0x01, args: 1 },
            { name: "setTxLoopTimestamp", func_code: 0x02, args: 1 },
            { name: "sendBalance", func_code: 0x03, args: 1 },
            { name: "getCurrentBlockheight", func_code: 0x04, args: 1 },
            { name: "getWeakRandomNumber", func_code: 0x05, args: 1 },
            { name: "getCreator", func_code: 0x06, args: 1 },
            { name: "getCurrentBalance", func_code: 0x07, args: 1 },
            { name: "getBlockheight", func_code: 0x08, args: 2 },
            { name: "getAmount", func_code: 0x09, args: 2 },
            { name: "getSender", func_code: 0x0A, args: 2 },
            { name: "getType", func_code: 0x0B, args: 2 },
            { name: "readAssets", func_code: 0x0C, args: 2 },
            { name: "sendAmount", func_code: 0x0D, args: 2 },
            { name: "sendMessage", func_code: 0x0E, args: 2 },
            { name: "getCreatorOf", func_code: 0x0F, args: 2 },
            { name: "getCodeHashOf", func_code: 0x10, args: 2 },
            { name: "getActivationOf", func_code: 0x11, args: 2 },
            { name: "getAssetBalance", func_code: 0x12, args: 2 },
            { name: "mintAsset", func_code: 0x13, args: 2 },
            { name: "getAssetCirculating", func_code: 0x14, args: 2 },
            { name: "readMessage", func_code: 0x15, args: 3 },
            { name: "getQuantity", func_code: 0x16, args: 3 },
            { name: "sendAmountAndMessage", func_code: 0x17, args: 3 },
            { name: "sendQuantity", func_code: 0x18, args: 3 },
            { name: "setMapValue", func_code: 0x19, args: 3 },
            { name: "getMapValue", func_code: 0x1A, args: 3 },
            { name: "getAssetHoldersCount", func_code: 0x1B, args: 3 },
            { name: "sendQuantityAndAmount", func_code: 0x1C, args: 4 },
            { name: "getExtMapValue", func_code: 0x1D, args: 4 },
            { name: "issueAsset", func_code: 0x1E, args: 4 },
            { name: "distributeToHolders", func_code: 0x1F, args: 5 }            
        ],
    };

    const AsmObj = {
        startingMemory: 0, // Start filling variables from this location
        memory:   Array(256), // 'name'
        code:     [], // { source: "", address: 0, station: "", jumpLabel: "", branchLabel: "", size: 0, content: [], content_type: [], hexstring: "" }
        data:     [], // [ 0n, 0n, 1200n ]
        labels:   [], // { label: "asdf", address: 1234}
        define:   [], // ["asdf"] = "as4ad"
        PName:    "",
        PDescription: "",
        PActivationAmount: "",
        asmCode: "",
        bytecode: "",
    };

    const Code_Template = {
        source: "",
        address: -1,
        station: "",
        jumpLabel: "",
        branchLabel: "",
        size: 0,
        content: [ ],
        content_type: [],
        hexstring: ""
    };

    function bytecode_main() {

        //process line by line
        const source = assembly_source.split("\n")

        // remove comments
        const lines = source.map( (asm_line) => asm_line.split("#")[0])

        //first pass, fill address, opcodes, apicodes, constants
        lines.forEach( (asm_line, idx) => {
            let parts, j;
            //loop thru all regex expressions
            for (j=0; j<dvscAsmSpec.op_code_table.length; j++) {
                parts=dvscAsmSpec.op_code_table[j].regex.exec(asm_line);
                if (parts !== null) {
                    process(parts, dvscAsmSpec.op_code_table[j], idx + 1);
                    return;
                }
            }

            throw new TypeError(`Error line ${idx + 1}: No matching rule.`);
        });

        //second pass, solve branches offsets
        do {
            AsmObj.labels = [];
            AsmObj.code.reduce( fillAddress, 0);
        } while ( ! AsmObj.code.every( checkBranches ));

        //third pass, push jump an branches.
        AsmObj.code.forEach( fillJumpsAndBranches );

        //last pass, join all contents in little endian notation (code)
        AsmObj.code.forEach( finishHim );

        return buildRetObj();
    }

    function process(parts, instruction, currentLine) {

        function getAndSetMemoryAddress(asm_name) {
            let idx = AsmObj.memory.findIndex(value => value === asm_name);
            if (idx === -1) {
                idx = AsmObj.memory.findIndex((value, num) => num >= AsmObj.startingMemory && value === undefined);
                if (idx === -1) {
                    throw new TypeError(`Error at line ${currentLine}: memory is full. No more variables allowed.`);
                }
                AsmObj.memory[idx] = asm_name;
            }
            return idx;
        }

        let CodeObj = JSON.parse(JSON.stringify(Code_Template));

        //debug helper
        CodeObj.source=parts[0];

        switch (instruction.op_code) {
        case 0x100:
            return;
        case 0x101: // label
            CodeObj.station = parts[1];
            AsmObj.code.push(CodeObj);
            return;
        case 0x102: // .adr
            if (AsmObj.memory[parts[2]]) {
                throw new TypeError(`Error at line ${currentLine}: redeclaring variable at memory address ${parts[2]}.`);
            }
            AsmObj.memory[Number(parts[2])] = parts[1];
            return;
        case 0x103: // .define
            if (AsmObj.define[parts[1]] !== undefined) {
                throw new TypeError(`Error at line ${currentLine}: ${parts[1]} already defined.`);
            }
            AsmObj.define[parts[1]] = parts[2];
            return;
        case 0x104: // .functionInfo
            if (AsmObj.define[parts[1]] === undefined) {
                throw new TypeError(`Error at line ${currentLine}: Extern function info depends on defining the function first ${parts[1]}.`);
            }
            parts[2].split(",").forEach(memString => {
                let range = memString.split("-");
                if (range.length === 1) {
                    AsmObj.memory[Number(range[0])] = parts[1];
                } else {
                    for (let idx=Number(range[0]); idx <= Number(range[1]); idx++) {
                        AsmObj.memory[idx] = parts[1];
                    }
                }
            })
            return;
        case 0x105: // .startingAddress
            AsmObj.startingMemory = Number(parts[1]);
            return;
        }

        //push OpCode at content[]
        CodeObj.size = 1;
        CodeObj.content.push(instruction.op_code);
        CodeObj.content_type.push("O");

        for (let i=0 ; i < instruction.args_type.length; i++) {
            let type=instruction.args_type.charAt(i);
            switch (type) {
            case "T":
            case "U":
            case "S":
                let varName = defineOrValue(parts[i+1]);
                let bitParam;
                if (varName === "$") {
                    // Register
                    // bitParam is zero, no need to update opCode value neither size;
                    continue;
                } else if (varName[0] === "*") {
                    // Content of Variable address
                    bitParam = 0x3 << (type === "U" ? 2 : 0);
                    CodeObj.content.push(getAndSetMemoryAddress(varName.slice(1)));
                } else if (!isNaN(varName)) {
                    // Its a Number!
                    if (type == "T" || type == "U") {
                        // Numbers are invalid for target
                        throw new TypeError(`Error at line ${currentLine}: Invalid value for target.`);
                    }
                    bitParam = 0x2;
                    CodeObj.content.push(adjustBits(varName, 8, currentLine));
                } else {
                    bitParam = 0x1 << (type === "U" ? 2 : 0);
                    CodeObj.content.push(getAndSetMemoryAddress(varName));
                }
                CodeObj.content[0] |= bitParam;
                CodeObj.size++;
                CodeObj.content_type.push(type);
                continue;
            case "l":
                CodeObj.size += 8;
                CodeObj.content.push(adjustBits(parts[i+1], 64, currentLine));
                CodeObj.content_type.push(type);
                continue;
            case "s":
                CodeObj.size += 2;
                CodeObj.content.push(adjustBits(parts[i+1], 16, currentLine));
                CodeObj.content_type.push(type);
                continue;
            case "B": //branch offset will be processed later
                CodeObj.size++;
                CodeObj.branchLabel = parts[i+1];
                continue;
            case "J": //jump will be processed later
                CodeObj.size += 2;
                CodeObj.jumpLabel = parts[i+1];
                continue;
            case "F": // SYS function
                let search = dvscAsmSpec.sys_code_table.find( obj => obj.name === parts[1]);
                if (search === undefined) {
                    throw new TypeError(`Error at line ${currentLine}: invalid SYS function.`);
                }
                CodeObj.content[0] |= search.func_code;
                const varArgs = parts[2].split(",")
                varArgs.shift();
                if (varArgs.length !== search.args) {
                    throw new TypeError(`Error at line ${currentLine}: Invalid number of arguments for sys function ${search.name}.`);
                }
                for (const varArg of varArgs) {
                    CodeObj.size++;
                    CodeObj.content.push(getAndSetMemoryAddress(varArg.trim()));
                    CodeObj.content_type.push(type);
                }
                continue;
            default:
                throw new TypeError(`Internal error at line ${currentLine}: Found a rule with wrong parameter.`);
            }
        }
        AsmObj.code.push(CodeObj);
    }

    function adjustBits(str, bits, currentLine) {
        bits = BigInt(bits);
        str = defineOrValue(str);
        if (isNaN(str)) {
            throw new TypeError(`Error at line ${currentLine}: Invalid number value.`);
        }
        let val = BigInt(str);
        if (val >= 1n << bits || val < -1n << (bits - 1n) ) {
            throw new TypeError(`Error at line ${currentLine}: Immediate value must be ${bits}-bit.`);
        }
        if (val < 0n) {
            val += 1n << (bits);
        }
        return val
    }

    function defineOrValue(val) {
        if (AsmObj.define[val] !== undefined) {
            return AsmObj.define[val];
        }
        return val;
    }

    function fillAddress( currAddr, currItem) {

        currItem.address = currAddr;
        if (currItem.station.length != 0) {
            AsmObj.labels.push({ label: currItem.station, address: currAddr});
        }
        return currAddr + currItem.size;
    }

    function checkBranches(CodeObj, idx) {

        if (CodeObj.content[0] === 0x02 && CodeObj.address % 32 !== 31 && AsmObj.code[idx + 1].content[0] !== 0x01) {
            let NOPCode = JSON.parse(JSON.stringify(Code_Template));
            // instruction starting in one page and ending in another. Not allowed!
            NOPCode.source = "JNCP padding";
            NOPCode.size = 1;
            NOPCode.content.push(0x01);
            NOPCode.content_type.push("O");
            for (let i = 0; i < 31 - (CodeObj.address % 32); i++) {
                AsmObj.code.splice(idx + 1, 0, JSON.parse(JSON.stringify(NOPCode)))
            }
            return false; // do it again.
        }
        if (CodeObj.branchLabel.length != 0) {
            let search = AsmObj.labels.find( obj => obj.label === CodeObj.branchLabel );
            if (search === undefined) {
                throw new TypeError(`Error at line: ${idx + 1}: Found an unknow label`);
            }
            let offset = search.address - (CodeObj.address + CodeObj.size);

            if (offset < -128 || offset > 127 ) {
                // branch offset overflow
                // create jump operation
                let JumpCode =  JSON.parse(JSON.stringify(Code_Template));
                JumpCode.source = "JUMP: " + CodeObj.source;
                JumpCode.size = 3;
                JumpCode.jumpLabel = CodeObj.branchLabel;
                JumpCode.content.push(0xB4);
                JumpCode.content_type.push("O");

                // change op_code
                switch (CodeObj.content[0]) {
                    case 0xB8: CodeObj.content[0] = 0xB9; break; // BZ   -> BNZ 
                    case 0xB9: CodeObj.content[0] = 0xB8; break; // BNZ  -> BZ
                    case 0xBA: CodeObj.content[0] = 0xBD; break; // BGZ  -> BLEZ
                    case 0xBB: CodeObj.content[0] = 0xBC; break; // BLZ  -> BGEZ 
                    case 0xBC: CodeObj.content[0] = 0xBB; break; // BGEZ -> BLZ
                    case 0xBD: CodeObj.content[0] = 0xBA; break; // BLEZ -> BGZ
                    case 0xBE:  // BA -> JMP 
                        CodeObj.content[0] = 0xB4;
                        CodeObj.size = 3;
                        JumpCode.jumpLabel = CodeObj.branchLabel;
                        CodeObj.branchLabel = ""
                        // No need to swap, just update opcode. End
                        clearPaddingNops();
                        return false;
                }
                // change branch destination
                CodeObj.branchLabel = "__" + CodeObj.address;
                if (AsmObj.code[idx + 1].station.length != 0) {
                    // station already filled, add a new code for label
                    let LabelCode =  JSON.parse(JSON.stringify(Code_Template));
                    LabelCode.source = "JUMP: " + CodeObj.source;
                    LabelCode.size = 0;
                    LabelCode.station = "__" + CodeObj.address;
                    AsmObj.code.splice(idx + 1, 0, JumpCode, LabelCode);
                } else {
                    AsmObj.code[idx + 1].station = "__" + CodeObj.address;
                    // insert jump operation
                    AsmObj.code.splice(idx + 1, 0, JumpCode);
                }
                clearPaddingNops();
                return false; // do it again.
            }
        }
        return true;
    }

    function clearPaddingNops() {
        AsmObj.code = AsmObj.code.filter(cdObj => cdObj.source !== "JNCP padding");
    }

    function fillJumpsAndBranches(CodeObj) {

        if (CodeObj.branchLabel.length != 0) {
            let search = AsmObj.labels.find( obj => obj.label=== CodeObj.branchLabel );
            let offset = search.address - (CodeObj.address + CodeObj.size);
            CodeObj.content.push(offset);
            CodeObj.content_type.push("B");
        } else if (CodeObj.jumpLabel.length != 0) {
            let search = AsmObj.labels.find( obj => obj.label=== CodeObj.jumpLabel );
            if (search === undefined) {
                throw new TypeError("bytecode compiling error #5");
            }
            CodeObj.content.push(search.address);
            CodeObj.content_type.push("J");
        }
        delete CodeObj.branchLabel;
        delete CodeObj.jumpLabel;
    }

    function buildRetObj() {

        const codepages=Math.ceil(AsmObj.bytecode.length / (64));
        // TODO right calculation
        const minimumfee=(codepages)*7350000;
        return {
            CodePages: codepages,
            MinimumFeeNQT: minimumfee,
            JSONmap: {
                "Memory": AsmObj.memory,
                "Labels": AsmObj.labels
            },
            AsmCode: AsmObj.asmCode,
            ByteCode: AsmObj.bytecode,
            Memory: AsmObj.memory,
            Labels: AsmObj.labels,
        };
    }

    function finishHim(CodeObj) {

        for (let i=0; i< CodeObj.content.length; i++ ){
            CodeObj.hexstring+=number2hexstring(CodeObj.content[i], CodeObj.content_type[i]);
        }
        if (CodeObj.size !== 0) {
            AsmObj.asmCode +=
                parseInt(CodeObj.address / 32).toString(16).padStart(2,"0") + "." +
                parseInt(CodeObj.address % 32).toString(16).padStart(2,"0") + ": " +
                CodeObj.hexstring +
                " # ".padStart(23 - CodeObj.hexstring.length) + CodeObj.source + "\n";
        } else {
            AsmObj.asmCode += CodeObj.source + "\n"
        }
        AsmObj.bytecode += CodeObj.hexstring;
    }

    function number2hexstring(value, type) {

        switch (type) {
        case "O":
        case "T":
        case "U":
        case "S":
        case "F":
            return value.toString(16).padStart(2,"0");
        case "B":
            if (value >= 0) {
                return value.toString(16).padStart(2,"0");
            }
            return (256 + value).toString(16).padStart(2,"0");
        case "J":
            return parseInt(value % 32).toString(16).padStart(2,"0") +
                parseInt(value / 32).toString(16).padStart(2,"0");
        }

        let bytes = 0;
        let ret_str = "";
        let conv_value = BigInt(value);

        if (type === "s") bytes=2;
        if (type === "l") bytes=8;

        for (let i = 0, base = 256n ; i < bytes; i++) {
            ret_str += (conv_value % base).toString(16).padStart(2, "0");
            conv_value = conv_value / base;
        }

        return ret_str;
    }

    return bytecode_main();
}
