"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/DASC-for-Signum
// License: GLP-3.0

function assembler(assembly_source) {

    const dvscAsmSpec = {
        section_table: [
            { name: "bss", regex: /^\s*\.bss\s*$/},
            { name: "data", regex: /^\s*\.data\s*$/},
            { name: "code", regex: /^\s*\.code\s*$/}
        ],
        bss_table: [
            { name: "blank", regex: /^\s*$/},
            { name: "zeroall", regex: /^\s*.zeroall\s*$/},
            { name: "variable", regex: /^\s*(\w+)(\s*\[(\d+)\])?\s*$/}
        ],
        data_table: [
            { name: "define", regex: /^\s*.define\s+(\w+)\s(.+)$/},
            { name: "blank", regex: /^\s*$/},
            { name: "number", regex: /^\s*(\w+)(\s*\[(\d+)\])?\s+(-?\w+)\s*$/},
            { name: "string", regex: /^\s*(\w+)(\s*\[(\d+)\])?\s+(["'].+)$/},
            { name: "array", regex: /^\s*(\w+)(\s*\[(\d+)\])\s+(\[.+)$/}
        ],
        op_code_table: [
            { op_code: 0x100, name: "blank", size:0, args_type: "",regex: /^\s*$/},
            { op_code: 0x101, name: "label", size:0, args_type: "",regex: /^\s*(\w+):\s*$/},
            { op_code: 0x00, name: "RST", size: 1, args_type: "",regex: /^\s*RST\s*$/i},
            { op_code: 0x01, name: "NOP", size: 1, args_type: "",regex: /^\s*NOP\s*$/i},
            { op_code: 0x10, name: "SET", size:1, args_type: "US", regex: /^\s*SET\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x20, name: "ADD", size:1, args_type: "US", regex: /^\s*ADD\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x30, name: "SUB", size:1, args_type: "US", regex: /^\s*SUB\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x40, name: "MUL", size:1, args_type: "US", regex: /^\s*MUL\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x50, name: "DIV", size:1, args_type: "US", regex: /^\s*DIV\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x60, name: "OR",size:1, args_type: "US", regex: /^\s*OR\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x70, name: "XOR", size:1, args_type: "US", regex: /^\s*XOR\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x80, name: "SHL", size:1, args_type: "US", regex: /^\s*SHL\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0x90, name: "SHR", size:1, args_type: "US", regex: /^\s*SHR\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0xA0, name: "AND", size:1, args_type: "US", regex: /^\s*AND\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0xB0, name: "RET", size:1, args_type: "", regex: /^\s*RET\s*$/i},
            { op_code: 0xB1, name: "JMPR", size:1, args_type: "", regex: /^\s*JMPR\s*$/i},
            { op_code: 0xB2, name: "SRA", size:1, args_type: "", regex: /^\s*SRA\s*$/i},
            { op_code: 0xB3, name: "LRA", size:1, args_type: "", regex: /^\s*LRA\s*$/i},
            { op_code: 0xB4, name: "JMP", size:1, args_type: "J", regex: /^\s*JMP\s+(&?\w+)\s*$/i},
            { op_code: 0xB5, name: "CALL", size:1, args_type: "J", regex: /^\s*CALL\s+(&?\w+)\s*$/i},
            { op_code: 0xB7, name: "HARA", size:1, args_type: "J", regex: /^\s*HARA\s+(&?\w+)\s*$/i},
            { op_code: 0xB8, name: "BZ", size:1, args_type: "B", regex: /^\s*BZ\s+(&?\w+)\s*$/i},
            { op_code: 0xB9, name: "BNZ", size:1, args_type: "B", regex: /^\s*BNZ\s+(&?\w+)\s*$/i},
            { op_code: 0xBA, name: "BGZ", size:1, args_type: "B", regex: /^\s*BGZ\s+(&?\w+)\s*$/i},
            { op_code: 0xBB, name: "BLZ", size:1, args_type: "B", regex: /^\s*BLZ\s+(&?\w+)\s*$/i},
            { op_code: 0xBC, name: "BGEZ", size:1, args_type: "B", regex: /^\s*BGEZ\s+(&?\w+)\s*$/i},
            { op_code: 0xBD, name: "BLEZ", size:1, args_type: "B", regex: /^\s*BLEZ\s+(&?\w+)\s*$/i},
            { op_code: 0xBE, name: "BA", size:1, args_type: "B", regex: /^\s*BA\s+(&?\w+)\s*$/i},
            { op_code: 0xBF, name: "BX", size:3, args_type: "BXSS", regex: /^\s*BX\s+(\$|[&*-]?[\w"']+)\s*([!=<>]+)\s+(\$|[&*-]?[\w"']+),\s*(&?\w+)\s*$/i},
            { op_code: 0xC0, name: "SYS", size:1, args_type: "F", regex: /^\s*SYS\s+(\w+)(.*)$/i},
            { op_code: 0xE0, name: "MOD", size:1, args_type: "US", regex: /^\s*MOD\s+(\$|[*]?\w+)\s*,\s*(\$|[&*-]?[\w"']+)\s*$/i},
            { op_code: 0xF0, name: "SLEEP", size: 1, args_type: "S",regex: /^\s*SLEEP\s+(\$|[*]?[\w"']+)\s*$/i},
            { op_code: 0xF4, name: "NOT", size:1, args_type: "T",regex: /^\s*NOT\s+(\$|[*]?\w+)\s*$/i},
            { op_code: 0xF8, name: "SET16", size:1, args_type: "Ts", regex: /^\s*SET16\s+(\$|[*]?\w+)\s*,\s*([&-]?[\w"']+)\s*$/i},
            { op_code: 0xFC, name: "SET64", size:1, args_type: "Tl", regex: /^\s*SET64\s+(\$|[*]?\w+)\s*,\s*(-?[\w"']+)\s*$/i}
        ],
        sys_code_table: [
            { name: "getTxLoopTimestamp", func_code: 0x00, args: 1 },
            { name: "setTxLoopTimestamp", func_code: 0x01, args: 1 },
            { name: "sendBalance", func_code: 0x02, args: 1 },
            { name: "getCurrentBlockheight", func_code: 0x03, args: 1 },
            { name: "getWeakRandomNumber", func_code: 0x04, args: 1 },
            { name: "getCreator", func_code: 0x05, args: 1 },
            { name: "getCurrentBalance", func_code: 0x06, args: 1 },
            { name: "getBlockheight", func_code: 0x07, args: 2 },
            { name: "getAmount", func_code: 0x08, args: 2 },
            { name: "getSender", func_code: 0x09, args: 2 },
            { name: "getType", func_code: 0x0A, args: 2 },
            { name: "readAssets", func_code: 0x0B, args: 2 },
            { name: "sendAmount", func_code: 0x0C, args: 2 },
            { name: "sendMessage", func_code: 0x0D, args: 2 },
            { name: "getCreatorOf", func_code: 0x0E, args: 2 },
            { name: "getCodeHashOf", func_code: 0x0F, args: 2 },
            { name: "getActivationOf", func_code: 0x10, args: 2 },
            { name: "getAssetBalance", func_code: 0x11, args: 2 },
            { name: "mintAsset", func_code: 0x12, args: 2 },
            { name: "getAssetCirculating", func_code: 0x13, args: 2 },
            { name: "getNextTxDetails", func_code: 0x14, args: 3 },
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
        memory:   [], // { name: "varname", value: 645n }
        code:     [], // { source: "", address: 0, station: "", jumpLabel: "", branchLabel: "", size: 0, content: [], content_type: [], hexstring: "" }
        data:     [], // [ 0n, 0n, 1200n ]
        labels:   [], // { label: "asdf", address: 1234}
        define:   [], // ["asdf"] = "as4ad"
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

    const header = {
        magic: 0x31435356,
        ID: 0,
        NID: 0,
        programSize: 0,
        clearNID: 0
    }

    function bytecode_main() {
        let bssLines = []
        let dataLines = []
        let codeLines = []
        let bssVars = 0
        let dataVars = 0

        //process line by line
        const source = assembly_source.split("\n")

        // remove comments
        const lines = source.map( (asm_line) => asm_line.split("#")[0])

        // consolidate sections
        let section = "code"
        lines.forEach( (asm_line, idx) => {
            let parts, j;
            for (j=0; j<dvscAsmSpec.section_table.length; j++) {
                parts=dvscAsmSpec.section_table[j].regex.exec(asm_line)
                if (parts !== null) {
                    section = dvscAsmSpec.section_table[j].name
                    return
                }
            }
            switch (section) {
            case "data":
                dataLines.push({content: asm_line, line: idx + 1})
                break;
            case "bss":
                bssLines.push({content: asm_line, line: idx + 1})
                break;
            default: // case "code":
                codeLines.push({content: asm_line, line: idx + 1})
                break;
            }
        })

        // reserve space for header
        AsmObj.memory.push({ name: "_header", value: 0n })

        // process data
        dataLines.forEach( (item) => {
            let parts, j;
            let value;
            //loop thru all regex expressions
            for (j=0; j<dvscAsmSpec.data_table.length; j++) {
                parts=dvscAsmSpec.data_table[j].regex.exec(item.content);
                if (parts !== null) {
                    switch (dvscAsmSpec.data_table[j].name) {
                    case "number":
                        value = decodeString(parts[4])
                        if (value === undefined) {
                            throw new TypeError(`Error at line ${item.line}: Invalid number '${parts[3]}'`);
                        }
                        if (parts[2] === undefined) {
                            declareMemory(parts[1], item.line, value % (1n << 64n))
                            value /= 1n << 64n
                        } else {
                            for (let i=0; i< Number(parts[3]); i++) {
                                declareMemory(`${parts[1]}_${i}`, item.line, value % (1n << 64n))
                                value /= 1n << 64n
                            }
                        }
                        if (value !== 0n) {
                            throw new TypeError(`Error at line ${item.line}: Number overflow (too big) '${parts[4]}'`);
                        }
                        break
                    case "string":
                        value = parts[4].trim()
                        if ((value.startsWith('"') && !value.endsWith('"')) ||
                            (value.startsWith("'") && !value.endsWith("'"))) {
                            throw new TypeError(`Error line ${item.line}: Invalid quoted string: ${parts[4]}`);
                        }
                        value = decodeString(value)
                        if (value === undefined) {
                            throw new TypeError(`Error at line ${item.line}: Invalid quoted string '${parts[4]}'`);
                        }
                        if (parts[2] === undefined) {
                            declareMemory(parts[1], item.line, value % (1n << 64n))
                            value /= 1n << 64n
                        } else {
                            for (let i=0; i< Number(parts[3]); i++) {
                                declareMemory(`${parts[1]}_${i}`, item.line, value % (1n << 64n))
                                value /= 1n << 64n
                            }
                        }
                        if (value !== 0n) {
                            throw new TypeError(`Error at line ${item.line}: String overflow (too long) '${parts[4]}'`);
                        }
                        break
                    case "array":
                        value = parts[4].trim()
                        if (!value.endsWith(']')) {
                            throw new TypeError(`Error line ${item.line}: Invalid array value string: ${parts[4]}`);
                        }
                        let arrayValues = value.slice(1, -1).split(",")
                        if (arrayValues.length > Number(parts[3])) {
                            throw new TypeError(`Error at line ${item.line}: Too many array items in '${parts[4]}'`);
                        }
                        for (let i=0; i< Number(parts[3]); i++) {
                            const arrayVal = decodeString(arrayValues[i]?.trim())
                            if (arrayVal >= 1n << 64n ) {
                                throw new TypeError(`Error at line ${item.line}: Item overflow in '${parts[4]}', index ${i}.`);
                            }
                            declareMemory(`${parts[1]}_${i}`, item.line, arrayVal ?? 0n)
                        }
                        break
                    case "define":
                        if (AsmObj.define[parts[1]] !== undefined) {
                            throw new TypeError(`Error at line ${currentLine}: ${parts[1]} already defined.`);
                        }
                        AsmObj.define[parts[1]] = parts[2];
                        break
                    default:
                        // blank
                    }
                    return;
                }
            }
            throw new TypeError(`Error line ${item.line}: No matching rule in .data section.`);
        });
        dataVars = AsmObj.memory.length
        if (dataVars === 1) {
            header.ID = 0
        } else {
            header.ID = Math.ceil(dataVars / 4)
        }

        // process bss
        bssLines.forEach( (item) => {
            let parts, j;
            //loop thru all regex expressions
            for (j=0; j<dvscAsmSpec.bss_table.length; j++) {
                parts=dvscAsmSpec.bss_table[j].regex.exec(item.content);
                if (parts !== null) {
                    switch (dvscAsmSpec.bss_table[j].name) {
                    case "zeroall":
                        header.clearNID = 1
                        break
                    case "variable":
                        if (parts[2] === undefined) {
                            declareMemory(parts[1], item.line)
                            break;
                        }
                        for (let i = 0; i < Number(parts[3]); i++) {
                            declareMemory(`${parts[1]}_${i}`, item.line)
                        }
                        break
                    default:
                        // blank
                    }
                    return;
                }
            }
            throw new TypeError(`Error line ${item.line}: No matching rule for .bss section.`);
        });
        bssVars = AsmObj.memory.length - dataVars
        if (bssVars + dataVars === 1) {
            header.NID = 0
        } else {
            header.NID = Math.ceil((bssVars + dataVars) / 4) - header.ID
            for (; (bssVars + dataVars) % 4 !== 0; bssVars++) {
                declareMemory(`_padding_${bssVars}`, -1, 0n)
            }
        }

        // Insert memory in code.
        AsmObj.memory.forEach( (item) => {
            AsmObj.code.push({
                source: `@${item.name}`,
                address: -1,
                station: "",
                jumpLabel: "",
                branchLabel: "",
                size: 8,
                content: [ item.value ],
                content_type: [ "l" ],
                hexstring: ""
            })
        })

        //first pass, fill address, opcodes, apicodes, constants
        codeLines.forEach( (item) => {
            let parts, j;
            //loop thru all regex expressions
            for (j=0; j<dvscAsmSpec.op_code_table.length; j++) {
                parts=dvscAsmSpec.op_code_table[j].regex.exec(item.content);
                if (parts !== null) {
                    process(parts, dvscAsmSpec.op_code_table[j], item.line);
                    return;
                }
            }
            throw new TypeError(`Error line ${item.line}: No matching rule for .code section.`);
        });

        //second pass, solve branches offsets
        do {
            AsmObj.labels = [];
            AsmObj.code.reduce( fillAddress, 0);
        } while ( ! AsmObj.code.every( checkBranches ));

        //third pass, push jump an branches.
        AsmObj.code.forEach( fillJumpsAndBranches );

        header.programSize = Math.ceil((AsmObj.code[AsmObj.code.length - 1].address + AsmObj.code[AsmObj.code.length - 1].size) / 32)
        AsmObj.code[0].content[0] = BigInt(header.magic) |
            BigInt(header.ID) << 32n |
            BigInt(header.NID) << 40n |
            BigInt(header.programSize) << 48n |
            BigInt(header.clearNID) << 56n

        //last pass, join all contents in little endian notation (code)
        AsmObj.code.forEach( finishHim );

        return buildRetObj();
    }

    function declareMemory(asm_name, line, value) {
        let idx = AsmObj.memory.findIndex(item => item.name === asm_name);
        if (idx !== -1) {
            throw new TypeError(`Error at line ${line}: Variable '${asm_name}' already declared.`);
        }
        AsmObj.memory.push({ name: asm_name, value: value ?? 0n})
    }

    function getMemoryAddress(asm_name, line) {
        let idx = AsmObj.memory.findIndex(item => item.name === asm_name);
        if (idx === -1) {
            throw new TypeError(`Error at line ${line}: Variable '${asm_name}' not declared.`);
        }
        return idx;
    }

    function process(parts, instruction, currentLine) {
        function getParam(str, type) {
            let varName = defineOrValue(str);
            let varValue = decodeString(varName);
            if (varName === "$") {
                // Register
                // bitParam is zero, no need to update opCode value neither size;
                return { bitParam: 0x0, value: undefined};
            }
            if (varName[0] === "*") {
                // Content of Variable address
                varName = defineOrValue(varName.slice(1));
                varValue = decodeString(varName);
                if (varValue !== undefined) {
                    // *25 (using defined memory address)
                    return { bitParam: 0x1, value: Number(varValue)};
                }
                // *mem (using memory name)
                return { bitParam: 0x3, value: getMemoryAddress(varName, currentLine)};
            }
            if (varValue !== undefined) {
                // Its a number!
                if (type == "T" || type == "U") {
                    // Numbers are invalid for target
                    throw new TypeError(`Error at line ${currentLine}: Invalid value for target.`);
                }
                return { bitParam: 0x2, value: adjustBits(varValue, 8, currentLine)};
            }
            if (varName[0] === "&") {
                // Its address of a memory!
                if (type == "T" || type == "U") {
                    //  address of a memory are invalid for target
                    throw new TypeError(`Error at line ${currentLine}: Invalid value for target.`);
                }
                return { bitParam: 0x2, value: adjustBits(getMemoryAddress(varName.slice(1), currentLine), 8, currentLine)};
            }
            return { bitParam: 0x1, value: getMemoryAddress(varName, currentLine)};
        }

        let CodeObj = JSON.parse(JSON.stringify(Code_Template));
        CodeObj.size = instruction.size;

        //debug helper
        CodeObj.source=parts[0];

        switch (instruction.op_code) {
        case 0x100:
            return;
        case 0x101: // label
            CodeObj.station = parts[1];
            AsmObj.code.push(CodeObj);
            return;
        case 0xBF: // BX is special
            CodeObj.content.push(instruction.op_code);
            CodeObj.content_type.push("O");
            let brchX = 0;
            switch (parts[2]) {
            case "==":
                brchX = 0x0;
                if (parts[3] === "0" ) {
                    brchX += 0x6;
                }
                break;
            case "!=":
                brchX = 0x1;
                if (parts[3] === "0" ) {
                    brchX += 0x6;
                }
                break;
            case ">":
                brchX = 0x2;
                break;
            case "<":
                brchX = 0x3;
                break;
            case ">=":
                brchX = 0x4;
                break;
            case "<=":
                brchX = 0x5;
                break;
            }
            let param1 = getParam(parts[1], "S");
            let param2 = getParam(parts[3], "S");
            if (parts[3] === "0" ) {
                CodeObj.content.push((brchX << 4) | param1.bitParam);
            } else {
                CodeObj.content.push((brchX << 4) | (param1.bitParam << 2) | param2.bitParam);
            }
            CodeObj.content_type.push("X");

            if (param1.bitParam !== 0) {
                CodeObj.content.push(param1.value);
                CodeObj.content_type.push("S");
                CodeObj.size++;
            }
            if (parts[3] !== "0" && param2.bitParam !== 0) {
                CodeObj.content.push(param2.value);
                CodeObj.content_type.push("S");
                CodeObj.size++;
            }
            CodeObj.branchLabel = parts[4];
            AsmObj.code.push(CodeObj);
            return;
        }

        //push OpCode at content[]
        CodeObj.content.push(instruction.op_code);
        CodeObj.content_type.push("O");

        for (let i=0 ; i < instruction.args_type.length; i++) {
            let type=instruction.args_type.charAt(i);
            switch (type) {
            case "T":
            case "U":
            case "S":
                let param = getParam(parts[i+1], type);
                if (param.bitParam === 0x0) {
                    // Register
                    // bitParam is zero, no need to update opCode value neither size;
                    continue;
                }
                CodeObj.content.push(param.value);
                CodeObj.content_type.push(type);
                if (type === "U") {
                    CodeObj.content[0] |= param.bitParam << 2;
                } else {
                    CodeObj.content[0] |= param.bitParam;
                }
                CodeObj.size++;
                continue;
            case "l":
                CodeObj.size += 8;
                CodeObj.content.push(adjustBits(decodeString(defineOrValue(parts[i+1])), 64, currentLine));
                CodeObj.content_type.push(type);
                continue;
            case "s":
                CodeObj.size += 2;
                let argument2 = defineOrValue(parts[i+1])
                if (argument2.startsWith("&")) {
                    // using address of a label
                    CodeObj.jumpLabel = argument2.slice(1);
                    continue
                }
                CodeObj.content.push(adjustBits(decodeString(argument2), 16, currentLine));
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
                    let para = getParam(varArg.trim(),"S");
                    if (para.bitParam !== 1) {
                        throw new TypeError(`Error at line ${currentLine}: SYS functions only accept arguments type '01': Memory addresses. Argument '${varArg.trim()}' does not match the type.`);
                    }
                    CodeObj.size++;
                    CodeObj.content.push(para.value);
                    CodeObj.content_type.push(type);
                }
                continue;
            default:
                throw new TypeError(`Internal error at line ${currentLine}: Found a rule with wrong parameter.`);
            }
        }
        AsmObj.code.push(CodeObj);
    }

    function adjustBits(value, bits, currentLine) {
        if (value === undefined) {
            throw new TypeError(`Error at line ${currentLine}: Expecting a number.`);
        }
        bits = BigInt(bits);
        if (value >= 1n << bits || value < -1n << (bits - 1n) ) {
            throw new TypeError(`Error at line ${currentLine}: value '${value}' must be ${bits}-bit.`);
        }
        if (value < 0n) {
            value += 1n << (bits);
        }
        return value
    }

    // If it is a quoted string, converts it to decimal number
    function decodeString(str) {
        try {
            if (str.startsWith('"') || str.startsWith("'")) {
                const textEncoder = new TextEncoder();
                const encoded = textEncoder.encode(str.slice(1,-1));
                return encoded.reduceRight((accumulator, currentValue) => (accumulator << 8n) + BigInt(currentValue), 0n)
            }
            return BigInt(str.split("_").join(""))
        } catch (e) {
            return undefined
        }
    }

    function defineOrValue(val) {
        if (AsmObj.define[val] !== undefined) {
            return AsmObj.define[val].trim();
        }
        return val.trim();
    }

    function fillAddress( currAddr, currItem) {

        currItem.address = currAddr;
        if (currItem.station.length != 0) {
            AsmObj.labels.push({ label: currItem.station, address: currAddr});
        }
        return currAddr + currItem.size;
    }

    function checkBranches(CodeObj, idx) {

        if (CodeObj.branchLabel.length != 0) {
            let addr = getLabelAddress(CodeObj.branchLabel);
            let offset = addr - (CodeObj.address + CodeObj.size);

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
                        CodeObj.jumpLabel = CodeObj.branchLabel;
                        CodeObj.branchLabel = ""
                        // No need to swap, just update opcode. End
                        return false;
                    case 0xBF:
                        let origparam = CodeObj.content[1] & 0xF;
                        switch (CodeObj.content[1] >> 4) {
                        case 0x0: CodeObj.content[1] = 0x10 | origparam; break;
                        case 0x1: CodeObj.content[1] = 0x00 | origparam; break;
                        case 0x2: CodeObj.content[1] = 0x50 | origparam; break;
                        case 0x3: CodeObj.content[1] = 0x40 | origparam; break;
                        case 0x4: CodeObj.content[1] = 0x30 | origparam; break;
                        case 0x5: CodeObj.content[1] = 0x20 | origparam; break;
                        case 0x6: CodeObj.content[1] = 0x70 | origparam; break;
                        case 0x7: CodeObj.content[1] = 0x60 | origparam; break;
                        }
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
                return false; // do it again.
            }
        }
        return true;
    }

    function getLabelAddress(labelName) {
        let search
        if (labelName.startsWith("&")) {
            let content = labelName.slice(1)
            if (/^\d+$/.test(content) || /^0x[\da-fA-F]+$/.test(content)) {
                // it's a number
                search = { address: Number(content)}
            } else {
                // it's a variable
                search = AsmObj.code.find(item => item.source === `@${content}`)
            }
        } else {
            // it's a regular label
            search = AsmObj.labels.find(obj => obj.label === labelName );
        }
        if (search === undefined) {
            throw new TypeError(`Error 5 at compilation: Label '${labelName}' not found.`);
        }
        return search.address
    }

    function fillJumpsAndBranches(CodeObj) {

        if (CodeObj.branchLabel.length != 0) {
            let addr = getLabelAddress(CodeObj.branchLabel);
            let offset = addr - (CodeObj.address + CodeObj.size);
            CodeObj.content.push(offset);
            CodeObj.content_type.push("B");
        } else if (CodeObj.jumpLabel.length != 0) {
            let addr = getLabelAddress(CodeObj.jumpLabel);
            CodeObj.content.push(addr);
            CodeObj.content_type.push("J");
        }
        delete CodeObj.branchLabel;
        delete CodeObj.jumpLabel;
    }

    function buildRetObj() {

        const codepages=Math.ceil(AsmObj.bytecode.length / (64));
        // TODO right calculation
        const minimumfee=(codepages)*7350000;

        let deployHex = AsmObj.bytecode
        if (header.ID + header.NID > 1) {
            deployHex = AsmObj.bytecode.slice(0, 64 * (header.ID ? header.ID : 1)) + AsmObj.bytecode.slice(64 * (header.ID + header.NID))
        }

        return {
            CodePages: codepages,
            MinimumFeeNQT: minimumfee,
            JSONmap: {
                "Memory": AsmObj.memory,
                "Labels": AsmObj.labels
            },
            AsmCode: AsmObj.asmCode,
            ByteCode: AsmObj.bytecode,
            DeployCode: deployHex,
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
                parseInt(CodeObj.address).toString(16).padStart(4,"0") + ": " +
                CodeObj.hexstring +
                " # ".padStart(23 - CodeObj.hexstring.length) + CodeObj.source + "\n";
        } else {
            AsmObj.asmCode += "  " + CodeObj.source + "\n"
        }
        AsmObj.bytecode += CodeObj.hexstring;
    }

    function number2hexstring(value, type) {
        let bytes = 0;

        switch (type) {
        case "O":
        case "T":
        case "U":
        case "S":
        case "F":
        case "X":
            bytes = 1;
            break;
        case "B":
            bytes = 1;
            if (value < 0) {
                value += 256;
            }
            break;
        case "s":
        case "J":
            bytes=2;
            break;
        case "l":
            bytes=8;
            if (value < 0n) {
                value += 1n << 64n;
            }
        }

        let ret_str = "";
        let conv_value = BigInt(value);

        for (let i = 0, base = 256n ; i < bytes; i++) {
            ret_str += (conv_value % base).toString(16).padStart(2, "0");
            conv_value = conv_value / base;
        }

        return ret_str;
    }

    return bytecode_main();
}
