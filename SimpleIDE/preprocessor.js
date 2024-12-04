function highLevelProcessor(program) {
    'use strict';
    
    //Must match RegexCode order!
    const RegexID = {
        IF: 0,
        ELSE: 1,
        ENDIF: 2,
        WHILE: 3,
        LOOP: 4,
        REPEAT: 5,
        UNTIL: 6,
        CONTINUE: 7,
        BREAK: 8
    }

    const RegexCode = [
       /^\s*if\s+(\$|[&*-]?[\w"']+)\s*([<>=!]+)\s*(\$|[&*-]?[\w"']+)\s*$/,
       /^\s*else\s*$/,
       /^\s*endif\s*$/,
       /^\s*while\s+(\$|[&*-]?[\w"']+)\s*([<>=!]+)\s*(\$|[&*-]?[\w"']+)\s*$/,
       /^\s*loop\s*$/,
       /^\s*repeat\s*$/,
       /^\s*until\s+(\$|[&*-]?[\w"']+)\s*([<>=!]+)\s*(\$|[&*-]?[\w"']+)\s*$/,
       /^\s*continue\s*$/,
       /^\s*break\s*$/
    ];

    
    var rFound;        //regex Found
    var i, j, k;       //iterators
    var comment_start; //index of starting ; comment
    var lineBefCom;    //line contents before ; comment
    var lineAftCom;    //line contents after ; comment
    var parts;         //to store string splitted
    var rel_stmt;      //assembly relational statement
    var loops_info = [ ]; //array of objects storing all loops information
    var ifs_info = [ ]; //array of objects storing all ifs information
    var indentation_level = -1;
    var query;
    var jmp_string;
    let params;
    var debug = 1;     //will print optional if_start label.
    
    var lines = program.split("\n")
    var ret = ""
    for (i=0; i<lines.length; i++) {
        //remove comments with ;
        comment_start = lines[i].indexOf(";");
        if (comment_start >=0){
            lineBefCom = lines[i].slice(0,comment_start);
            lineAftCom = lines[i].slice(comment_start);
        } else {
            lineBefCom = lines[i];
            lineAftCom = "";
        }
        //loop thru all regex expressions
        for (j=0; j<RegexCode.length; j++) {
            //we have a matching regex expression
            if ((RegexCode[j]).exec(lineBefCom) !== null) {
                switch (j) {
                    case RegexID.IF:
                        indentation_level++;
                        ifs_info.push( { "ID": i,
                                         "Started": false, //to be used next pass
                                         "Ended": false,
                                         "Level": indentation_level,
                                         "HasElse": false,
                                         "ElseUsed": false });
                        break;
                    case RegexID.ELSE:
                        query=ifs_info.filter(ifs => ifs.Ended === false);
                        if (query.length == 0)
                            return "error line "+i+": 'else' without starting 'if'";
                        if (query[query.length-1].ElseUsed === true)
                            return "error line "+i+": two 'else' for same 'if'";
                        query[query.length-1].HasElse = true;
                        query[query.length-1].ElseUsed = true;
                        break;
                    case RegexID.ENDIF:
                        query=ifs_info.filter(ifs => ifs.Ended === false);
                        if (query.length == 0)
                            return "error line "+i+": 'endif' without starting 'if'";
                        query[query.length-1].Ended = true;
                        indentation_level--;
                        break;
                    case RegexID.WHILE:
                        indentation_level++;
                        loops_info.push( { "ID": i,
                                           "Started": false, //to be used next pass
                                           "Ended": false,
                                           "Level": indentation_level,
                                           "Type": RegexID.WHILE });

                        break;
                    case RegexID.LOOP:
                        query=loops_info.filter(loops => loops.Ended === false).pop();
                        if (query === undefined)
                            return "error line "+i+": 'loop' without starting 'while' or 'repeat'";
                        if (query.Level != indentation_level)
                            return "error line "+i+": if..else..endif not ended inside current loop";
                        query.Ended = true;
                        indentation_level--;
                        break;
                    case RegexID.REPEAT:
                        indentation_level++;
                        loops_info.push( { "ID": i,
                                           "Started": false, //to be used next pass
                                           "Ended": false,
                                           "Level": indentation_level,
                                           "Type": RegexID.REPEAT });
                        break;
                    case RegexID.UNTIL:
                        query=loops_info.filter(loops => loops.Ended === false).pop();
                        if (query === undefined)
                            return "error line "+i+": 'until' without starting 'repeat'";
                        if (query.Type != RegexID.REPEAT)
                            return "error line "+i+": while..until loop no allowed";
                        if (query.Level != indentation_level)
                            return "error line "+i+": if..else..endif not ended inside current loop";
                        query.Ended = true;
                        indentation_level--;
                        break;
                    default:
                        break; //match for CALL_RET or CALL
                }
                j=RegexCode.length;//break regex loop
            }
        }
    }

    query = ifs_info.find(ifs => ifs.Ended === false);
    if (query !== undefined)
        return "error line "+query.ID+": if without endif";
    query = loops_info.find(loops => loops.Ended === false);
    if (query !== undefined)
        return "error line "+query.ID+": loop has no end";

    //reset state
    ifs_info.forEach(ifs => { ifs.Ended = false;} )
    loops_info.forEach(loops => { loops.Ended = false;} )
    
    //second pass
    for (i=0; i<lines.length; i++) {
        rFound=0;
        parts=/\s*;.*/.exec(lines[i]);
        if (parts !== null){
            lineBefCom=lines[i].slice(0,-parts[0].length);
            lineAftCom=parts[0];
        } else {
            lineBefCom=lines[i];
            lineAftCom="";
        }
        //loop thru all regex expressions
        for (j=0; j<RegexCode.length; j++) {
            parts = (RegexCode[j]).exec(lineBefCom);
            //we have a matching regex expression
            if (parts !== null) {
                let padding = "".padStart(parts[0].search(/\S/),' ')
                rFound = 1;
                switch (j) {
                    case RegexID.IF:
                        query = ifs_info.find(ifs => ifs.Started === false);
                        query.Started = true;
                        if (debug == 1)
                            ret += padding+"_if"+query.ID+":\n";
                        try { rel_stmt = createStatement( parts[1], parts[2], parts[3], i); }
                        catch (error) { return  error; }
                        if (query.HasElse === true)
                            jmp_string = "_if"+query.ID+"_else";
                        else
                            jmp_string = "_if"+query.ID+"_endif";
                        ret += padding+rel_stmt+" "+jmp_string+lineAftCom+"\n";
                        break;
                    case RegexID.ELSE:
                        query=ifs_info.filter(ifs => ifs.Started === true && ifs.Ended === false).pop();
                        ret += padding+"BA _if"+query.ID+"_endif\n";   
                        ret += padding+"_if"+query.ID+"_else:"+lineAftCom+"\n"
                        break;
                    case RegexID.ENDIF:
                        query=ifs_info.filter(ifs => ifs.Started === true && ifs.Ended === false).pop();
                        query.Ended = true;
                        ret += padding+"_if"+query.ID+"_endif:"+lineAftCom+"\n"
                        break;
                    case RegexID.WHILE:
                        query = loops_info.find(loops => loops.Started === false);
                        query.Started = true;
                        ret += padding+"_loop"+query.ID+":\n";
                        try { rel_stmt = createStatement( parts[1], parts[2], parts[3], i); }
                        catch (error) { return  error; }
                        jmp_string = "_loop"+query.ID+"_end";
                        ret += padding+rel_stmt+" "+jmp_string+lineAftCom+"\n";
                        break;
                    case RegexID.LOOP:
                        query=loops_info.filter(loops => loops.Started === true && loops.Ended === false).pop();
                        query.Ended = true;
                        ret += padding+"BA _loop"+query.ID+lineAftCom+"\n";
                        ret += padding+"_loop"+query.ID+"_end:\n";
                        break;
                    case RegexID.REPEAT:
                        query = loops_info.find(loops => loops.Started === false);
                        query.Started = true;
                        ret += padding+"_loop"+query.ID+":"+lineAftCom+"\n";
                        break;
                    case RegexID.UNTIL:
                        query=loops_info.filter(loops => loops.Started === true && loops.Ended === false).pop();
                        try { rel_stmt = createStatement( parts[1], parts[2], parts[3], i); }
                        catch (error) { return  error; }
                        jmp_string = "_loop"+query.ID;
                        query.Ended = true;
                        ret += padding+rel_stmt+" "+jmp_string+lineAftCom+"\n";
                        ret += padding+"_loop"+query.ID+"_end:\n";
                        break;
                    case RegexID.CONTINUE:
                        query=loops_info.filter(loops => loops.Started === true && loops.Ended === false).pop();
                        ret += padding+"BA _loop"+query.ID+lineAftCom+"\n";
                        break;
                    case RegexID.BREAK:
                        query=loops_info.filter(loops => loops.Started === true && loops.Ended === false).pop();
                        ret += padding+"BA _loop"+query.ID+"_end"+lineAftCom+"\n";
                        break;
                    default:
                        ret+="not implemented\n";
                        break;
                }
                j=RegexCode.length;//break regex loop
            }
        }
        if (rFound == 0)
            ret+=lineBefCom+lineAftCom+"\n";
    }
    return ret;
    
    //translates expression to assembly instructions (inversed logic)
    function createStatement( var1, condition, var2, line) {
        let stmt="";
        
        if (var1 == "$" && var2 == "0") { // simpler case
            switch(condition) {
                case "==":
                    stmt+=`BNZ`;
                    break;
                case "!=":
                    stmt+=`BZ`;
                    break;
                case  ">":
                    stmt+="BLEZ"
                    break;
                case ">=":
                    stmt+="BLZ"
                    break;
                case  "<":
                    stmt+="BGEZ"
                    break;
                case "<=":
                    stmt+="BGZ"
                    break;
                default:
                    throw "error line "+line+": only ==, !=, >, <, >=, <= relational operators are allowed";
            }
            return stmt;
        }
        stmt+=`BX ${var1} `
        switch(condition) {
            case "==":
                stmt+="!="; break
            case "!=":
                stmt+="=="; break
            case  ">":
                stmt+="<="; break
            case ">=":
                stmt+="<"; break
            case  "<":
                stmt+=">="; break
            case "<=":
                stmt+=">"; break
            default:
                throw "error line "+line+": only ==, !=, >, <, >=, <= relational operators are allowed";
        }
        stmt+=` ${var2},`
        return stmt;
    }
}
