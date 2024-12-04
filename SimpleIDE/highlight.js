const opCodeIDX  = 0;
const opSizeIDX  = 1;
const opRegexIDX = 2;

const allowedCodes = [
 /*opCode, Size,  Matching RegEx */
    [0xf0,  0,  /^\s*$/ ],
    [0xf1,  0,  /^\s*(\w+):\s*$/ ],
    [0xf2,  0,  /^\s*\.(data|bss|code)\s*$/ ],
    [0xf5,  0,  /^\s*(if)\s+(\$|[&*-]?[\w"']+)\s*([<>=!]+)\s*(\$|[&*-]?[\w"']+)\s*$/ ],
    [0xf6,  0,  /^\s*else\s*$/ ],
    [0xf7,  0,  /^\s*endif\s*$/ ],
    [0xf8,  0,  /^\s*(while)\s+(\$|[&*-]?[\w"']+)\s*([<>=!]+)\s*(\$|[&*-]?[\w"']+)\s*$/ ],
    [0xf9,  0,  /^\s*loop\s*$/ ],
    [0xfa,  0,  /^\s*repeat\s*$/ ],
    [0xfb,  0,  /^\s*(until)\s+(\$|[&*-]?[\w"']+)\s*([<>=!]+)\s*(\$|[&*-]?[\w"']+)\s*$/ ],
    [0xfc,  0,  /^\s*continue\s*$/ ],
    [0xfd,  0,  /^\s*break\s*$/ ],
    [-0x200, 0,  /^(\s*(?:SET|ADD|SUB|MUL|DIV|OR|XOR|SHL|SHR|AND|MOD)\s+)(\$|[*]?\w+)(\s*,\s*)(\$|[&*-]?[\w"']+)(\s*)$/i ],
    [-0x201, 0,  /^(\s*(?:JMP|BZ|BNZ|BGZ|BLZ|BGEZ|BLEZ|BA|HARA|CALL)\s+)((?:\w+)\s*)$/i ],                             // JMP :label
    [-0x202, 0,  /^(\s*(?:SLEEP|NOT)\s+)(\$|[*]?[\w"']+)(\s*)$/ ],
    [-0x203, 0,  /^\s*(RST|NOP|RET|JMPR|SRA|LRA)\s*$/ ],
    [-0x204, 0,  /^\s*(SYS)\s+(\w+)\s*(,\s*\w+\s*)*$/i ],
    [-0x205, 0,  /^(\s*BX\s+)(\$|[*]?\w+)(\s*[<>=!]+\s*)(\$|[&*-]?[\w"']+)(\s*,\s*)(\w+\s*)$/i ],
    ];

const allowedData = [
 /*opCode, Size,  Matching RegEx */
    [-0x100,  0,  /^\s*$/ ],
    [-0x101,  0,  /^\s*\.(data|bss|code)\s*$/ ],
    [-0x102,  0,  /^(\s*\w+)(\s+.+)$/ ],
    [-0x103,  0,  /^(\s*\w+\[)(\d+)(\])(\s+.+)$/ ],
    ];

const allowedBss = [
 /*opCode, Size,  Matching RegEx */
    [-0x300,  0,  /^\s*$/ ],
    [-0x301,  0,  /^\s*\.(data|bss|code|zeroall)\s*$/ ],
    [-0x302,  0,  /^(\s*\w+)\s*$/ ],
    [-0x303,  0,  /^(\s*\w+\[)(\d+)(\]\s*)$/ ],
    ];

const allowedFunctions = [
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
];

//w3CodeColor(document.getElementById("myDiv"),"js");
// based on w3schools code
function asmCodeColor(txt) {
    'use strict';

    //Choose your colors
    var asmCommentColor = "gray";
    var asmLabelColor = "green";
    var asmInstructionColor = "mediumblue";
    var asmPropertyColor = "purple";
    var asmNumberColor = "red";
    var asmErrorColor = "pink";
    var asmTextColor = "brown";

    return asmHighLight(txt);

    function asmHighLight(txt) {
        var tmp_string;
        var iFound, fFound; //instruction Found, function Found
        var i, j, k;  //iterators
        var comment_start; //index of starting ; comment
        var lineBefCom; //line contents before ; comment
        var lineAftCom; //line contents after ; comment
        var parts;  // to store string splitted

        //process line by line
        var line = txt.split("\n")
        var ret = ""
        let section = "code";
        //loop thru all lines
        for (i=0; i<line.length; i++) {
            iFound = 0;
            //starting processing comments with ;
            comment_start = line[i].indexOf("#");
            if (comment_start >=0){
                lineBefCom = line[i].slice(0,comment_start);
                lineAftCom = line[i].slice(comment_start);
            } else {
                lineBefCom = line[i];
                lineAftCom = "";
            }
            //loop thru all regex expressions
            switch (section) {
            case "data":
                for (j=0; j<allowedData.length; j++) {
                    //we have a matching regex expression
                    parts=allowedData[j][opRegexIDX].exec(lineBefCom);
                    if (parts !== null) {
                        break;
                    }
                }
                if (parts === null) {
                    ret += addErrorColor(lineBefCom);
                    if (lineAftCom.length >= 1) {
                        ret += spanColorAll(lineAftCom, asmCommentColor);
                    }
                    ret += "\n";
                    continue;
                }
                switch (allowedData[j][opCodeIDX]) {
                    case -0x100: //is empty line
                        ret += lineBefCom;
                        break;
                    case -0x101: //switching section
                        section = parts[1];
                        ret += spanColorAll(lineBefCom, asmPropertyColor);
                        break;
                    case -0x102:
                        ret += parts[1] + spanColorAll(parts[2], asmNumberColor);
                        break;
                    case -0x103:
                        ret += parts[1] + spanColorAll(parts[2], asmNumberColor)+ parts[3] + spanColorAll(parts[4], asmNumberColor);
                        break;
                    default:
                        ret += addErrorColor(lineBefCom);
                }
                if (lineAftCom.length >= 1) {
                    ret += spanColorAll(lineAftCom, asmCommentColor);
                }
                ret += "\n";
                continue;
            case "bss":
                for (j=0; j<allowedBss.length; j++) {
                    //we have a matching regex expression
                    parts=allowedBss[j][opRegexIDX].exec(lineBefCom);
                    if (parts !== null) {
                        break;
                    }
                }
                if (parts === null) {
                    ret += addErrorColor(lineBefCom);
                    if (lineAftCom.length >= 1) {
                        ret += spanColorAll(lineAftCom, asmCommentColor);
                    }
                    ret += "\n";
                    continue;
                }
                switch (allowedBss[j][opCodeIDX]) {
                    case -0x300: //is empty line
                    case -0x302:
                        ret += lineBefCom;
                        break;
                    case -0x303:
                        ret += parts[1] + spanColorAll(parts[2], asmNumberColor)+ parts[3];
                        break;
                    case -0x301: //switching section
                        section = parts[1];
                        ret += spanColorAll(lineBefCom, asmPropertyColor);
                        break;
                    default:
                        ret += addErrorColor(lineBefCom);
                }
                if (lineAftCom.length >= 1) {
                    ret += spanColorAll(lineAftCom, asmCommentColor);
                }
                ret += "\n";
                continue;
            case "code":
                for (j=0; j<allowedCodes.length; j++) {
                    //we have a matching regex expression
                    parts=allowedCodes[j][opRegexIDX].exec(lineBefCom);
                    if (parts !== null) {
                        break;
                    }
                }
                if (parts === null) {
                    ret += addErrorColor(lineBefCom);
                    if (lineAftCom.length >= 1) {
                        ret += spanColorAll(lineAftCom, asmCommentColor);
                    }
                    ret += "\n";
                    continue;
                }
                switch (allowedCodes[j][opCodeIDX]) {
                    case 0xf0: //is empty line
                        ret += lineBefCom;
                        break;
                    case 0xf1: //is label line
                        tmp_string = addSpanColor(lineBefCom,parts[1],asmLabelColor);
                        tmp_string = addSpanColorLast(tmp_string,":",asmPropertyColor);
                        ret += tmp_string;
                        break;
                        case 0xf2: //switching section
                        section = parts[1];
                        ret += spanColorAll(lineBefCom, asmPropertyColor);
                        break;

                            case 0xf5: //if
                            case 0xf8: //while
                            case 0xfb: //until
                                tmp_string = addSpanColor(lineBefCom,parts[3],asmPropertyColor);
                                tmp_string = addSpanColor(tmp_string,parts[1],asmPropertyColor);
                                ret += tmp_string;
                                break;
                            case 0xf6: //else
                            case 0xf7: //endif
                            case 0xf9: //loop
                            case 0xfa: //repeat
                            case 0xfc: //continue
                            case 0xfd: //break
                                ret += spanColorAll(lineBefCom,asmPropertyColor);
                                break;
                            case 0xfe: //call_ret
                                tmp_string = addSpanColor(lineBefCom,"=",asmPropertyColor);
                                tmp_string = addSpanColor(tmp_string,"call",asmPropertyColor);
                                tmp_string = addSpanColor(tmp_string,parts[2],asmLabelColor);
                                ret += tmp_string;
                                break;
                            case 0xff: //call
                                tmp_string = addSpanColor(lineBefCom,"call",asmPropertyColor)
                                tmp_string = addSpanColor(tmp_string,parts[1],asmLabelColor);
                                ret += tmp_string;
                                break;
                            case -0x200:
                                tmp_string = spanColorAll(parts[1],asmInstructionColor);
                                for (let i=2; i<6; i++) {
                                    if (i == 3 || i == 5) {
                                        tmp_string += parts[i]
                                        continue
                                    }
                                    switch (true) {
                                        case (parts[i] == "$"):
                                            tmp_string += spanColorAll("$",asmPropertyColor);
                                            break;
                                        case (/^\d+$/.test(parts[i])):
                                            tmp_string += spanColorAll(parts[i],asmNumberColor);
                                            break;
                                        case (/^\*\d+$/.test(parts[i])):
                                            tmp_string += "*" + spanColorAll(parts[i].slice(1),asmNumberColor);
                                            break;
                                        case (parts[i].charAt(0) == "'"):
                                        case (parts[i].charAt(0) == '"'):
                                            tmp_string += spanColorAll(parts[i],asmTextColor);
                                            break;
                                        default:
                                            tmp_string += parts[i];
                                    }
                                }
                                ret += tmp_string;
                                break;
                            case -0x202:
                                tmp_string = spanColorAll(parts[1],asmInstructionColor);
                                switch (true) {
                                    case (parts[2] == "$"):
                                        tmp_string += spanColorAll("$"+parts[3],asmPropertyColor);
                                        break;
                                    case (/^\d+$/.test(parts[2])):
                                        tmp_string += spanColorAll(parts[2]+parts[3],asmNumberColor);
                                        break;
                                    case (/^\*\d+$/.test(parts[2])):
                                        tmp_string += "*" + spanColorAll(parts[2].slice(1)+parts[3],asmNumberColor);
                                        break;
                                    case (parts[2].charAt(0) == "'"):
                                    case (parts[2].charAt(0) == '"'):
                                        tmp_string += spanColorAll(parts[2]+parts[3],asmTextColor);
                                        break;
                                    default:
                                        tmp_string += parts[2]+parts[2];
                                }
                                ret += tmp_string;
                                break;
                            case -0x203:
                                ret += spanColorAll(lineBefCom,asmInstructionColor);
                                break;
                            case -0x201:
                                ret += spanColorAll(parts[1],asmInstructionColor) + spanColorAll(parts[2],asmLabelColor)
                                break;
                            case -0x204:
                                tmp_string = addSpanColor(lineBefCom,parts[1],asmInstructionColor);
                                let foundFunction = allowedFunctions.find( item => item.name == parts[2])
                                if (foundFunction == undefined)
                                    tmp_string = addSpanColorError(tmp_string,parts[2],asmErrorColor);
                                else {
                                    tmp_string = addSpanColor(tmp_string,parts[2],asmInstructionColor);
                                }
                                ret += tmp_string
                                break;
                            case -0x205:
                                tmp_string = spanColorAll(parts[1],asmInstructionColor);
                                switch (true) {
                                    case (parts[2] == "$"):
                                        tmp_string += spanColorAll("$",asmPropertyColor);
                                        break;
                                    case (/^\d+$/.test(parts[2])):
                                        tmp_string += spanColorAll(parts[2],asmNumberColor);
                                        break;
                                    case (/^\*\d+$/.test(parts[2])):
                                        tmp_string += "*" + spanColorAll(parts[2].slice(1),asmNumberColor);
                                        break;
                                    case (parts[2].charAt(0) == "'"):
                                    case (parts[2].charAt(0) == '"'):
                                        tmp_string += spanColorAll(parts[2],asmTextColor);
                                        break;
                                    default:
                                        tmp_string += parts[2];
                                }
                                tmp_string += spanColorAll(parts[3],asmPropertyColor);
                                switch (true) {
                                    case (parts[4] == "$"):
                                        tmp_string += spanColorAll("$",asmPropertyColor);
                                        break;
                                    case (/^\d+$/.test(parts[4])):
                                        tmp_string += spanColorAll(parts[4],asmNumberColor);
                                        break;
                                    case (/^\*\d+$/.test(parts[2])):
                                        tmp_string += "*" + spanColorAll(parts[4].slice(1),asmNumberColor);
                                        break;
                                    case (parts[4].charAt(0) == "'"):
                                    case (parts[4].charAt(0) == '"'):
                                        tmp_string += spanColorAll(parts[4],asmTextColor);
                                        break;
                                    default:
                                        tmp_string += parts[4];
                                }
                                tmp_string += parts[5] + spanColorAll(parts[6],asmLabelColor);
                                ret += tmp_string;
                                break;

                            default:
                                //this should never be reached
                                ret += addErrorColor(lineBefCom);
                }
                if (lineAftCom.length >= 1) {
                    ret += spanColorAll(lineAftCom, asmCommentColor);
                }
                ret += "\n";
                continue;
            }
        }
        return ret;
    }
    function addSpanColor(source, text, color) {
        return  source.replace(text, "<span style='color:" + color + "'>" + text + "</span>");
    }
    function addSpanColorError(source, text, color) {
        return  source.replace(text, "<span style='background-color:" + color + "'>" + text + "</span>");
    }
    function addSpanColorLast(source, text, color) {
        var n = source.lastIndexOf(text);
        if (n >= 0)
            return source.slice(0,n) + "<span style='color:" + color + "'>" + text + "</span>" + source.slice(n+text.length);
        return  source;
    }
    function addSpanColorRegex(source, regex, color) {
        var result=regex.exec(source);
        if (result === null)
            return source;
        return source.replace(result[0], "<span  style='color:" + color + "'>" + result[0] + "</span>");
    }
    function addErrorColor(txt) {
        return "<span style=background-color:" + asmErrorColor + ">" + txt + "</span>";
    }
    function spanColorAll(txt, color) {
        return "<span style=color:" + color + ">" + txt + "</span>";
    }
}
