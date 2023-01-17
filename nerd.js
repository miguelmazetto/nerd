let acorn = require("acorn")
const fs = require("fs");
const path = require("path");
const process = require("process");
const { execSync } = require("child_process");
const { exit } = require("process");
const os = require("os");

let nativeL = new acorn.TokenType("{{", {beforeExpr: true, startsExpr: true})

let bar = os.platform() == "win32" ? '\\' : '/'

function plat(p){
    return p.replaceAll('\\','/')
}

function doerror(...a){
    console.error(...a)
    exit(1);
}

class NerdLangParser extends acorn.Parser {

    readToken(code){
        if(code == 123){
            if(this.pos == this.input.length-1)
                return this.raise(this.pos, "Unterminated left brace");

            else if(this.input.charCodeAt(this.pos + 1) == 123){ // {{
                var start = this.pos,
                    end = this.input.indexOf("}}", this.pos += 2);
                
                if (end === -1) 
                    return this.raise(this.pos - 2, "Unterminated native block");

                this.pos = end + 2;
                return this.finishToken(nativeL)
            }
        }
        return super.readToken(code);
    }

    parseExprAtom(refDestructuringErrors, forInit){
        if(this.type == nativeL){
            var node = this.startNode();
            node.content = this.input.substring(node.start+2, this.pos-2);
            this.next()
            return this.finishNode(node, "NativeBlock");
        }
        
        return super.parseExprAtom(refDestructuringErrors, forInit)
    }

}

function getAST(code){
    return NerdLangParser.parse(code, {ecmaVersion: 7, allowReturnOutsideFunction: true})
}

function genArray(arr, tab, ctx){
    var ret = []
    for (let i = 0; i < arr.length; i++)
        ret.push(generateCode(arr[i], tab, ctx))
    return ret
}

function tostr(s){
    return '"' + s.replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('\n','\\n') + '"'
}

function path_walker(curpath, target){
    var cur;
    if(curpath == ".")
        cur = []
    else
        cur = curpath.split(bar)

    var p = target.split(bar)
    for (let i = 0; i < p.length; i++) {
        switch(p[i]){
            case ".": break;
            case "..":
                cur.pop();
                break;
            default:
                cur.push(p[i])
        }
    }
    return cur.join(bar)
}

// console.log(ctx.stack) inside the compiler
function generateCode(AST, tab, ctx){
    ctx.stack = ctx.stack || []
    ctx.removestack = ctx.removestack || 0
    ctx.stack.unshift(AST)
    var ret = _generateCode(AST,tab,ctx);
    ctx.stack.shift()
    if(ctx.removestack > 0){
        ctx.removestack--
        return ""
    }
    return ret
}

var globalkeys = {prototype:true, exports:true}

//C++ Precedence
var operatorprecedence = [
    '%','/','*','-','+','>>','<<','>=','>','<=','<','!=','==','&',
    '^','|','&&','||','=','+=','-=','*=','/=','%=','<<=','>>=','&=','^=',
    '|='
]

// a + b - c

function _generateCode(AST, tab, ctx){
    if(!AST) return ""
    var ret = ""
    switch(String(AST.type)){
        case 'Program':
            ctx.scope = 0;
        case 'BlockStatement':
            const ib = ctx.ignorebracket
            const nnl = ctx.nonl
            ctx.ignorebracket = ctx.nonl = ctx.vardecl_as_expr = false
            ret = ib ? '' : '{\n'
            ret += genArray(AST.body, "\t"+tab, ctx).join("")
            ret += ib ? '' : tab+'}' + (nnl ? '' : '\n')
            return ret

        case 'ExpressionStatement':
            const nocomma = ctx.nocomma
            const nonl    = ctx.nonl
            ctx.nocomma = ctx.nonl = false;
            ret = tab + generateCode(AST.expression, tab, ctx)
            ret += (AST.expression.type != 'NativeBlock' ?
                (ctx.nocomma || nocomma ? '' : ';') +
                (ctx.nonl || nonl ? '' : '\n') : '')
            ctx.nocomma = ctx.nonl = false;
            return ret

        case 'CallExpression':
            var nthis = {type: 'Identifier', name: 'undefined'}
            if(AST.callee.type == "MemberExpression"){
                var prop = generateCode(AST.callee.property, tab, ctx);
                switch(prop){
                    case 'apply':
                        if(AST.arguments.length > 0)
                            nthis = AST.arguments.shift();
                        AST.callee = AST.callee.object;
                        break;
                }
            }

            var callee = generateCode(AST.callee, tab, ctx);
            var arglen = AST.arguments.length,
                arg0   = AST.arguments[0];

            if(callee == "include" && arglen > 0 && arg0.type == 'Literal'
                && typeof(arg0.value) == 'string' ){

                var str = arg0.value
                ctx.include = ctx.include || []
                ctx.include.push(str[0] == '<' ? str :
                    '<'+path.dirname(ctx.module_path)+'/'+str+'>')
                ctx.removestack = 2; // Removes the statement
                return ''
            }


            if(callee == "require"){
                if(arglen > 0 && arg0.type == 'Literal'
                    && typeof(arg0.value) == 'string'){

                    return ctx.process_require(arg0.value)
                    
                    //if(arg0.value.indexOf(".") != -1) // file instead of package
                    //    return callee + "(module, 0x" +
                    //        crc32(path_walker(path.dirname(ctx.modulepath), arg0.value)).toString(16).toUpperCase() +
                    //        " /* "+ arg0.value +" */)"
                    //else
                    //    return callee + "(module, 0x" +
                    //        crc32(arg0.value).toString(16).toUpperCase() +
                    //        " /* "+ arg0.value +" */)"
                }else{
                    throw "TODO: Only static requires are allowed!"
                }
            }

            if(['arguments','length_of','type_of'].indexOf(callee) == -1)
                AST.arguments.unshift(nthis)

            return callee + "(" + genArray(AST.arguments, tab, ctx).join(", ") + ")"

        case 'MemberExpression':
            if(!AST.computed)
                globalkeys[AST.property.name] = true;

            return generateCode(AST.object, tab, ctx) + "[" +
                    (AST.computed ?
                        generateCode(AST.property, tab, ctx) :
                        "N::"+AST.property.name)+"]"

        case 'Identifier':
            if(ctx.stack[1].type != 'MemberExpression'){
                switch(AST.name){
                    case 'arguments':
                        return 'arguments()'
                }
            }
            return AST.name

        case 'AssignmentExpression':
        case 'LogicalExpression':
        case 'BinaryExpression':
            var bf = '', aft ='';
            var lbf = '', laft = '';
            var rbf = '', raft = '';
            
            if(AST.left.type == 'BinaryExpression' || 
               AST.left.type == 'LogicalExpression' ||
               AST.left.type == 'AssignmentExpression'){

                var selfprec = operatorprecedence.indexOf(AST.operator)
                var leftprec = operatorprecedence.indexOf(AST.left.operator)
                if(selfprec == -1 || leftprec == -1) throw "Operator precedence error!";
                if(leftprec >= selfprec){
                    lbf = '('; laft = ')'
                }
            }

            if(AST.right.type == 'BinaryExpression' || 
               AST.right.type == 'LogicalExpression' ||
               AST.right.type == 'AssignmentExpression'){

                var selfprec = operatorprecedence.indexOf(AST.operator)
                var rightprec = operatorprecedence.indexOf(AST.right.operator)
                if(selfprec == -1 || rightprec == -1) throw "Operator precedence error!";
                if(rightprec >= selfprec){
                    rbf = '('; raft = ')'
                }
            }

            switch(AST.operator){
                // Simple operators, are the same in js and cpp
                case '=':
                    //if(ctx.stack[1].type != 'ExpressionStatement'){
                    //    bf='('; aft=', '+generateCode(AST.left, tab, ctx)+')'
                    //}
                case '+': case '-':
                case '*': case '/': case '%':
                case '<': case '<=':
                case '>': case '>=':
                case '==': case '!=':
                case '&&': case '||':
                case '+=': case '-=':
                case '*=': case '/=': 
                    //if(AST.operator == '/'){
                    //    console.log(ctx.stack)
                    //    exit(0);
                    //}
                    return bf+lbf+generateCode(AST.left, tab, ctx)+laft+
                           " " + AST.operator + " " +rbf+
                           generateCode(AST.right, tab, ctx)+raft+aft

                case '===':
                    return "__NERD_EQUAL_VALUE_AND_TYPE(" +
                           generateCode(AST.left, tab, ctx) + ', ' +
                           generateCode(AST.right, tab, ctx) + ')';

                case '!==':
                    return "__NERD_NOT_EQUAL_VALUE_AND_TYPE(" +
                           generateCode(AST.left, tab, ctx) + ', ' +
                           generateCode(AST.right, tab, ctx) + ')';
                
                case 'instanceof':
                    return "__NERD_INSTANCEOF(" +
                           generateCode(AST.left, tab, ctx) + ', ' +
                           generateCode(AST.right, tab, ctx) + ')';
                
                case '**':
                    return "pow(" +
                            generateCode(AST.left, tab, ctx) + ', ' +
                            generateCode(AST.right, tab, ctx) + ')';
                
                default:
                    console.log("Unknown operator:", AST.operator, AST)
                    return ''
            }
        
        case 'UnaryExpression':
            switch(AST.operator){
                // Simple operators, are the same in js and cpp
                case '!': case '-':
                case '+':
                    return AST.operator + generateCode(AST.argument, tab, ctx)
                case 'typeof':
                    return "type_of(" + generateCode(AST.argument, tab, ctx) + ")"
                case 'delete':
                    switch(AST.argument.type){
                        case 'Identifier':
                            return "delete "+AST.argument.name
                        case 'MemberExpression':
                            if(AST.argument.property.type == 'Identifier')
                                ret = tostr(AST.argument.property.name)
                            else
                                ret = generateCode(AST.argument.property, tab, ctx)
                            
                            return "__NERD_delete("+
                                generateCode(AST.argument.object, tab, ctx)+", "+ret+')';
                        default:
                            console.log('Unknown delete argument:', AST.argument)
                    }
                default:
                    console.log("Unknown unary operator:", AST.operator, AST)
                    return ''
            }
        
        case 'VariableDeclaration':
            const vdec = ctx.vardecl_as_expr
        
            ctx.vardecl_as_expr = false
            return (vdec ? '' : tab) + "var " +
                genArray(AST.declarations, tab, ctx).join(vdec?", var ":"; var ") +
                (vdec ? '' : ";\n");
        
        case 'VariableDeclarator':
            var idstr = generateCode(AST.id, tab, ctx)
            if(!AST.init) return idstr

            if(AST.init.type == 'FunctionExpression')
                ctx.funcvar = idstr

            ret = idstr + " = " + generateCode(AST.init, tab, ctx)

            ctx.funcvar = false
            return ret;
        
        case 'FunctionDeclaration':
            ctx.funcvar = generateCode(AST.id, tab, ctx)
            ret = tab + "var " + ctx.funcvar + " = "

        case 'FunctionExpression':
            //if(!ctx.funcvar && ctx.stack[1].type == 'AssignmentExpression' &&
            //        ctx.stack[2].type == 'ExpressionStatement'){
            //    ret = ''
            //    ctx.funcvar = generateCode(ctx.stack[1].left, tab, ctx)
            //}
            if(ctx.funcvar){
                var funcvar = ctx.funcvar;
                ctx.funcvar = false;
                ret += '__NERD_Create_Var_Scoped_Copy_Anon_With_Ref(' +
                    funcvar + ","
            }else{
                ret = '__NERD_Create_Var_Scoped_Copy_Anon('
            }
            ctx.ignorebracket = true
            ret += "{\n"
            var ntab = tab + "\t"

            if(AST.params.length > 0){
                ret += ntab + "var " + genArray(AST.params, ntab, ctx).join("; var ") + ";\n"
                for (let i = 0; i < AST.params.length; i++) {
                    const e = AST.params[i];
                    ret += ntab + "if(__NERD_VARLENGTH > "+i+") " +
                        generateCode(e.type == 'AssignmentPattern' ? e.left : e, ntab, ctx) +
                        " = __NERD_VARARGS["+i+"];\n"
                }
            }

            ret += generateCode(AST.body, tab, ctx) +
                ntab + 'return NerdCore::Global::null;\n'+tab+'})'

            if(AST.type == "FunctionDeclaration")
                ret += ";\n"

            return ret

        case 'ReturnStatement':
            return tab + "return " + generateCode(AST.argument, tab, ctx) + ";\n"
        
        case 'AssignmentPattern':
            return generateCode(AST.left, tab, ctx) + " = "+
                   generateCode(AST.right, tab, ctx)
        
        case 'ArrayExpression':
            return 'var(new NerdCore::Class::Array(' + genArray(AST.elements, tab, ctx).join(", ") + '))'
        
        case 'ObjectExpression':
            ntab = tab + "\t";
            return 'var(new NerdCore::Class::Object(' + (
                AST.properties.length == 0 ? '))' :
                "{\n" + ntab +
                genArray(AST.properties, tab, ctx).join(",\n" + ntab) +
                '\n' + tab +'}))')
        
        case 'Property':
            var key = generateCode(AST.key, tab, ctx);
            if(AST.key.type == "Identifier") key = tostr(key)
            return '{' + key + ', ' + generateCode(AST.value, '\t'+tab, ctx) + '}'
        
        case 'IfStatement':
            const notab = ctx.notab
            var conblock = AST.consequent.type == "BlockStatement"
            var altblock
            ctx.notab = false
            ctx.nonl = true
            var body = generateCode(AST.consequent, (conblock ? tab : tab+'\t'), ctx)
            ctx.nonl = false
            var alternate = '\n';
            if(AST.alternate){
                altblock = AST.alternate.type == "BlockStatement"
                ctx.notab = AST.alternate.type == 'IfStatement'
                alternate = (altblock || ctx.notab ?
                        (conblock ? ' else ' : tab+'else ') :
                        tab+'else\n') +
                    generateCode(AST.alternate, (altblock || ctx.notab ? tab : '\t'+tab), ctx)
            }
            ctx.notab = false
            return (notab ? '' : tab) +
                'if(' + generateCode(AST.test, tab, ctx) + ')' + (conblock ? '' : '\n')
                + body + (conblock ? '' : '\n') + alternate
        
        case 'ForStatement':
            ctx.vardecl_as_expr = true
            ret = tab + 'for(' + generateCode(AST.init, tab, ctx) + "; "
            ctx.vardecl_as_expr = true
            ret += generateCode(AST.test, tab, ctx) + "; "
            ctx.vardecl_as_expr = true
            ret += generateCode(AST.update, tab, ctx) + ")"
            ctx.vardecl_as_expr = false
            conblock = AST.body.type == "BlockStatement"
            return ret + (conblock?'':'\n') +
                generateCode(AST.body, (conblock ? tab : '\t'+tab), ctx)
        
        case 'UpdateExpression':
            return generateCode(AST.argument, tab, ctx) + AST.operator
        
        case 'WhileStatement':
            ctx.nonl = true
            ret = generateCode(AST.body, tab, ctx)
            ctx.nonl = false
            return tab + 'while(' + generateCode(AST.test, tab, ctx) + ")" + ret + '\n'
        
        case 'DoWhileStatement':
            ctx.nonl = true
            ret = generateCode(AST.body, tab, ctx)
            ctx.nonl = false
            return tab + 'do' + (ret[0] != "{" ? ' ' : '') + ret +
                    'while(' + generateCode(AST.test, tab, ctx) + ");\n"

        case 'ConditionalExpression':
            return generateCode(AST.test, tab, ctx) + ' ? ' +
                   generateCode(AST.consequent, tab, ctx) + ' : ' +
                   generateCode(AST.alternate, tab, ctx);

        case 'ThrowStatement':
            return tab + "throw " + generateCode(AST.argument, tab, ctx) + ";"

        case 'ForInStatement':
            if(AST.body.type != 'BlockStatement')
                AST.body = {type: 'BlockStatement', body: [AST.body]}
            AST.body.body.unshift({
                type: 'NativeBlock',
                content: '\t'+tab + generateCode(AST.left, tab, ctx)+' = '+
                    '__NERD_VARARGS[0];'
            })
            AST.body.body.push({type: 'ReturnStatement', argument:
                {type: 'Identifier', name: 'NerdCore::Global::null'}})

            ret = tab+'__NERD_FORIN('+generateCode(AST.right, tab, ctx)+', '
            ctx.nonl = true;
            return ret+generateCode(AST.body, tab, ctx)+');\n'

        case 'BreakStatement':
            return tab + 'break;\n'
    
        case 'ContinueStatement':
            return tab + 'continue;\n'

        case 'EmptyStatement': return ''
        
        case 'NewExpression':
            callee = generateCode(AST.callee, tab, ctx);
            switch(callee){
                case 'TypeError':
                    return 'var(var("TypeError: ")+'+genArray(AST.arguments, tab, ctx).join("+")+')'
                default:
                    return "__NERD_NEW("+callee+")("+
                        genArray(AST.arguments, tab, ctx).join(", ")+")"
            }

        case 'NativeBlock':
            return AST.content + '\n'

        case 'ThisExpression': return '__NERD_THIS'

        case 'Literal': // String, Number, etc...
            switch(typeof(AST.value)){
                case 'string':
                    return tostr(AST.value)
                case 'boolean':
                case 'number':
                    return AST.raw
                case 'object':
                    if(AST.value == null)
                        return "null"
                default:
                    console.log("Unknown Literal!", typeof(AST.value), AST)
                    return ''
            }

        default:
            console.log("Unknown type:",AST)
            return ''
    }
}

var module_table = []

function generateFile(AST, fout, outroot, options){

    options = options || {}
    options.ignorebracket = true
    options.include = options.include || []

    var gencode = generateCode(AST, '', options)

    var cpp = 
           '#define __MODULE_NAME 0x'+options.module_name+'\n'
    cpp += '#include <nerd_exports.hpp>\n'
    cpp += 'using namespace NerdCore::Global;\n\n'
    options.include.forEach(i => 
        cpp += '#include '+i+'\n')
    cpp += '\nvar __MODULE_'+options.module_name+'_main() {\n'
    cpp += '\t__NERD_INIT_MODULE('+tostr(options.module_path)+');\n'
    cpp += gencode
    cpp += '\treturn module[N::exports];\n'
    cpp += '}'

    return cpp
}

var crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r.charCodeAt(t))];return(-1^n)>>>0};
var packages = {}
var processed_modules = {}

function _processFile(fin, inroot, outroot, options){
    console.log("inroot = "+inroot,"fin = "+fin)
    console.log("Processing "+path.relative(inroot, fin))
    options = options || {}

    options.module_path = options.module_path || path.relative(inroot, fin)
    options.module_name = options.module_name || crc32(plat(options.module_path)).toString(16).toUpperCase()

    module_table.push({ path: options.module_path, name: options.module_name })

    var reqs = []

    options.process_require = function(name){
        var p = path_walker(path.dirname(fin), name)
        if(packages[name] || fs.existsSync(p)){
            reqs.push([name, p])
            return "require(module, 0x"+
                crc32(plat(path.relative(inroot, p))).toString(16).toUpperCase()+" /* "+name+" */)"
        }else
            throw "Could not find require: "+name
    }
    var fout = outroot+bar+options.module_path
    var out
    try{
        out = generateFile( getAST( fs.readFileSync(fin) ), fout, outroot, options)
    }catch(e){
        throw options.module_path+': '+e
    }
    fs.mkdirSync( path.dirname(fout), {recursive: true} )
    fs.writeFileSync(fout + ".cpp", out, {})
    src_array.push(tostr(plat(path.relative(outroot, fout+".cpp"))))

    reqs.forEach(v=>{
        if(processed_modules[v]) return;
        processed_modules[v] = true
        if(packages[v[0]]){
            _processPackage(outroot, packages[v[0]])
        }else{
            _processFile(v[1], inroot, outroot)
        }
    })
}

var pkgcmake = []
var cmakecached = []
var cmakecmdadd = []
var src_array = []

function _processPackage(outroot, options){

    if(options.nerd)
        if(options.nerd.lib){
            if(options.nerd.lib.cmake)
                pkgcmake.push(options.nerd.lib.cmake.join("\n"))
            if(options.nerd.lib.cmake_cached)
                cmakecached.push(options.nerd.lib.cmake_cached)
        }
    options.module_name = crc32(options.name).toString(16).toUpperCase()
    _processFile(options.root+bar+options.pkgdir+bar+options.main, options.root, outroot, options)
}

function registerPackages(pkgsdir, ext, root){
    if(!fs.existsSync(pkgsdir)) return;

    fs.readdirSync(pkgsdir, {withFileTypes: true}).forEach(pkg => {
        if(pkg.isDirectory()){
            var pkgdir = pkgsdir+bar+pkg.name
            var json = {};
            if(fs.existsSync(pkgdir + bar + "package.json"))
                json = JSON.parse(fs.readFileSync(pkgdir + bar + "package.json"));
            // TODO: To nerd
            json.main = json.main || "index." + ext;
            json.name = json.name || path.basename(pkgdir);
            if(!fs.existsSync(pkgdir + bar + json.main)){
                console.log("Could not find main file of package "+pkg.name+'!');
            }
            json.root = root
            json.pkgsdir = pkgsdir
            json.pkgdir = pkgdir
            json.ext = ext;
            packages[json.name] = json
        }
    })
}

function processExports(dirout, env){
    var out = '#pragma once\n'
    //out +=    '#include "'+ path.relative(dirout, "nerdcore/src/nerd.hpp") +'"\n'
    out +=    '#include <nerdcore/src/nerd.hpp>\n'
    //out +=    'using namespace NerdCore::Global;\n'

    var req = "\n#define __NERD_GET_REQTABLE() { \\\n"

    module_table.forEach(v => {
        out += '\n// ' + v.path + '\n'
        out += 'NerdCore::VAR __MODULE_' + v.name + '_main();\n'

        req += "\treqmodule{ 0x"+v.name+", __MODULE_"+v.name+"_main }, \\\n"
    })

    req += "}\n"
    out += req +
            "#define __NERD_STDENV_INIT() \\\n"
    env_h = "#define __NERD_STDENV_H() \\\n"
    env_c = "#define __NERD_STDENV_C() \\\n"

    env.forEach(p => {
        var varname = p, hash = crc32(plat(p)).toString(16).toUpperCase();
        if(fs.existsSync("nerd_modules"+bar+p+bar+"package.json")){
            var json = JSON.parse(fs.readFileSync("nerd_modules"+bar+p+bar+"package.json"))
            if(json.nerd){
                if(json.nerd.stdvarname)
                    varname = json.nerd.stdvarname
            }
        }
        if(varname == "require") return;
        out += "\t"+varname+" = require(__NERD_THIS, 0x"+hash+"); \\\n"
        if(varname == "Object") return;
        env_h+="\textern NerdCore::VAR "+varname+"; \\\n"
        env_c+="\tNerdCore::VAR "+varname+"; \\\n"
    })
    out = [out.substring(0, out.length-3),
           env_h.substring(0, env_h.length-3),
           env_c.substring(0, env_c.length-3)].join("\n\n")+
           '\n\n#define __NERD_EXPORTED\n'+
           '#include <nerdcore/src/nerd.hpp>\n'

    out += "using namespace NerdCore::Global;\n"
    out += "namespace NerdCore::Global::N\n{\n"
    out += '\tconst H::hkey __proto__ = H::hkey{"__proto__", H::hash("__proto__")};\n'
    out += '\tconst H::hkey __this__ = H::hkey{"this", H::hash("this")};\n'
    for (const key in globalkeys) {
        if(key == "this") continue;
        out += '\tconst H::hkey '+key+' = H::hkey{"'+key+'", H::hash("'+key+'")};\n'
    }
    out += "}\n"

    fs.writeFileSync(dirout + bar + "nerd_exports.hpp", out)
}

function getCPPFiles(_dir, rel){
    var ret = []
    var dir = fs.readdirSync(_dir, {withFileTypes: true})
    dir.forEach(d => {
        if(d.isDirectory()){
            ret = ret.concat(getCPPFiles(_dir + "/" + d.name, rel))
        }else if(d.isFile()){
            //console.log(path.extname(d.name))
            var ext = path.extname(d.name)
            if(ext == ".cpp" || ext == ".c")
                ret.push(tostr(path.relative(rel, _dir + "/" + d.name)))
        }
    })
    return ret
}

function cmakeReplace(str){
    return str.replaceAll('__EXTERN__','${NERD_PATH}/external')
              .replaceAll('__PROJ__','${NERD_PROJ}')
              .replaceAll('__CACHE__','${NERD_CACHE}')
}

function createCMake(dirout){
    var cmake = 'set(NERD_PROJ nerd_program CACHE PATH "Nerd Output Name")\n'
        cmake +='set(NERD_PATH '+tostr(plat(__dirname))+' CACHE PATH "Path to nerd")\n'
        cmake +='set(NERD_CACHE "${NERD_PATH}/.nerd")\n'
        cmake +='project(${NERD_PROJ})\n'
        cmake +='add_executable(${NERD_PROJ} \n'
        cmake += '\t'+tostr('${NERD_PATH}/nerdcore/src/nerd.cpp')+'\n'
        cmake += '\t'+src_array.join("\n\t")+'\n'
        cmake += ')\n'
        cmake += "set_property(TARGET ${NERD_PROJ} PROPERTY CXX_STANDARD 17)\n"
        cmake += "set_property(TARGET ${NERD_PROJ} PROPERTY INTERPROCEDURAL_OPTIMIZATION TRUE)\n"
        cmake += "target_include_directories(${NERD_PROJ} PRIVATE ${NERD_PATH})\n"
        cmake += "target_include_directories(${NERD_PROJ} PRIVATE .)\n\n"
        cmake += cmakeReplace(pkgcmake.join("\n\n"))

    fs.writeFileSync(dirout + bar + "CMakeLists.txt", cmake)
}

function setEntry(fin, dirin, dirout){
    var fout = dirout + bar + path.relative(dirin, fin) + '.cpp'
    var module_name = crc32(plat(path.relative(dirin, fin))).toString(16).toUpperCase()
    var out = '\n\nint main(int argc, char** argv){\n' // TODO args to process.argv
        out +='\t__NERD_INIT_VALUES(argc, argv);\n'
        out +='\treturn __MODULE_' + module_name + '_main();\n}'
    fs.appendFileSync(fout, out);
}

function runcmakecached(){
    cmakecached.forEach(c => {
        c.path = cmakeReplace(c.path).replaceAll("${NERD_PATH}",__dirname)
        var cachepath = ".nerd"+bar+c.name
        if(!fs.existsSync(cachepath)){
            fs.mkdirSync(cachepath, {recursive: true})
            process.chdir(cachepath)
            console.log("running "+"cmake "+c.path)
            execSync("cmake "+c.path, {stdio: 'inherit'})
            execSync("cmake --build ." + (os.platform() != "win32" ? " -- -j" : ""), {stdio: 'inherit'})
            process.chdir(__dirname)
        }
        var fullpath = path.resolve(cachepath+bar+"CMakeCache.txt")
        var newcachefp = path.resolve(cachepath+bar+"SetCMakeCache.txt")
        var newcache = []
        var read = fs.readFileSync(fullpath).toString()
        read.split("\n").forEach(line => {
            line = line.replaceAll('\r','')
            if(line[0] == "#" || line[0] == "/" || line.length<7) return;
            if(line.startsWith("CMAKE")) return;
            line = line.split("=")
            var value = line[1]
            line = line[0].split(":")
            newcache.push('set('+line[0]+' '+tostr(value)+' CACHE '+line[1]+' "Cached from '+cachepath.replaceAll('\\','\\\\')+'")')
        })
        fs.writeFileSync(newcachefp, newcache.join("\n"))
        cmakecmdadd.push("-C "+tostr(newcachefp))
    })
}

function doconfigure(dir){
    fs.mkdirSync(dir+bar+"build")
    process.chdir(dir+bar+"build")
    execSync("cmake "+cmakecmdadd.join(" ")+" ..", {stdio: 'inherit'})
    process.chdir(__dirname)
}

function dobuild(dir){
    process.chdir(dir+bar+"build")
    execSync("cmake --build ." + (os.platform() != "win32" ? " -- -j" : ""), {stdio: 'inherit'})
    process.chdir(__dirname)
}

//preprocess_require("in/test.ng")

registerPackages("nerd_modules","ng",__dirname)

function copyother(dirin, dirout){
    var dir = fs.readdirSync(dirin, {withFileTypes: true})
    if(dir.length > 0)
        dir.forEach(d => {
            var add = bar+d.name
            if(d.isDirectory()){
                copyother(dirin + add, dirout + add)
            }else if(d.isFile()){
                var ext = path.extname(d.name)
                if(ext == ".js" || ext == ".ng" || ext == ".ts" || ext == ".json") return;
                if(!fs.existsSync(dirout)) fs.mkdirSync(dirout, {recursive: true})
                fs.copyFile(dirin + add, dirout + add, ()=>{})
            }
        })
}

function noentry_err(){
    throw 'Could not find package.json\n'+
          'Check the path or set a custom entry with -E or --entry\n';
}

function _processProject(dirin, dirout, options){
    options = options || {}
    var entry
    if(options.entry)
        entry = options.entry
    else{
        var json = dirin+bar+'package.json'
        if(!fs.existsSync(json)) noentry_err();
        json = JSON.parse(fs.readFileSync(json))
        if(!json.main) noentry_err();
        entry = dirin+bar+json.main
    }
    console.log("entry = "+entry)

    registerPackages(dirin+bar+"node_modules","js",dirin)
    registerPackages(dirin+bar+"nerd_modules","ng",dirin)

    var env = [] // std packages regardless of options

    if(options.env) env=env.concat(options.env)

    if(fs.existsSync(dirout))
        fs.rmSync(dirout, {recursive: true})
    
    _processPackage(dirout, packages["require"])
    env.forEach(pkg => _processPackage(dirout, packages[pkg]))

    _processFile(entry, dirin, dirout);

    processExports(dirout, env);

    //copyother(__dirname+'/nerd_modules', dirout+'/nerd_modules');
    //copyother(dirin, dirout);

    setEntry(entry, dirin, dirout);

    createCMake(dirout)

    if(options.dontdocache) return;
    runcmakecached()

    if(options.dontconfigure) return;
    doconfigure(dirout)

    if(options.dontbuild) return;
    dobuild(dirout)
}

var JSenv = ["console","Object","JSON","Math","RegExp"];

//_processProject("in", "out")


function CLI(options){
    var options = options || {}
    var dirin, dirout;
    var args = process.argv.slice(2);
    var isdir = false
    for (let i = 0; i < args.length; i++) {
        var arg = args[i];
        
        if(arg.startsWith("--")){
            switch(arg){
                case '--output':
                    arg = args[++i];
                    if(!arg) doerror('Option --output must accompany output path!');
                    dirout = arg;
                    break;
                case '--generate':
                    options.dontconfigure = true;
                    break;
                case '--entry':
                    arg = args[++i];
                    if(!arg) doerror('Option --entry must accompany entry file path!');
                    if(!fs.existsSync(arg)) doerror('Given entry does not exist!');
                    options.entry = path.resolve(arg);
                    break;
                default:
                    doerror("Unknown option: "+arg)
            }
        }else if (arg.startsWith("-")){
            switch(arg){
                case '-O':
                    arg = args[++i];
                    if(!arg) doerror('Option -O must accompany output path!');
                    dirout = arg;
                    break;
                case '-G':
                    options.dontconfigure = true;
                    break;
                case '-E':
                    arg = args[++i];
                    if(!arg) doerror('Option -E must accompany entry file path!');
                    if(!fs.existsSync(arg)) doerror('Given entry does not exist!');
                    options.entry = path.resolve(arg);
                    break;
                default:
                    doerror("Unknown option: "+arg)
            }
        }else{
            var stat = fs.statSync(arg)
            if(stat.isFile()){
                dirin = path.dirname(arg)
                options.entry = path.resolve(arg)
            }else if(stat.isDirectory()){
                isdir = true;
                dirin = arg;
            }else{
                doerror("Given input '"+arg+"' does not exist!");
            }
        }
    }

    if(!dirout)
        dirout = ".nerd"+bar+"projects"+bar+
            crc32(plat((isdir?path.basename:path.dirname)(dirin)))
                .toString(16).toUpperCase();

    dirin = path.resolve(dirin)
    process.chdir(__dirname);

    options.env = JSenv

    _processProject(dirin, dirout, options)
}

CLI()