/**
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 */

const input = '(add 2 (subtract 4 2))';
const output = 'add(2, subtract(4, 2))';

const strReg = /[a-z]/;
const spaceReg = /\s/;
const numReg = /[0-9]/; 

/**
 * ============================================
 *                   (^@^)
 *                THE TOKENIZER
 * ============================================
 */
function tokenizer() {
    //词法分析进度
    let current = 0;
    //词法分析结果
    let tokens = [];
    while(current < input.length) {
        const char = input[current];
        //处理括号
        if (char === '(' || char === ')') {
            tokens.push({
                type: 'paren',
                name: char
            })
            current++;
            continue;
        }
        //处理标识符
        if (strReg.test(char)) {
            let value = char;
            current++;
            while(strReg.test(input[current])) {
                value += input[current];
                current++;
            }
            tokens.push({
                type: 'name',
                name: value
            })
            continue;
        }
        //处理空格
        if (spaceReg.test(char)) {
            current++;
            continue;
        }
        //处理数字
        if (numReg.test(char)) {
            let value = char;
            current++;
            while(numReg.test(input[current])) {
                value += input[current];
                current++;
            }
            tokens.push({
                type: 'number',
                name: value
            })
            continue;
        }
    }
    return tokens;
}

/**
 * ============================================
 *                   (^@^)
 *                THE PARSER
 * ============================================
 */

 // *   {
//     *     type: 'Program',
//     *     body: [{
//     *       type: 'CallExpression',
//     *       name: 'add',
//     *       params: [{
//     *         type: 'NumberLiteral',
//     *         value: '2',
//     *       }, {
//     *         type: 'CallExpression',
//     *         name: 'subtract',
//     *         params: [{
//     *           type: 'NumberLiteral',
//     *           value: '4',
//     *         }, {
//     *           type: 'NumberLiteral',
//     *           value: '2',
//     *         }]
//     *       }]
//     *     }]
//     *   }

/**
 * 语法分析
 * @param {*} tokens 
 */
function parser(tokens) {
    let current = 0;
    let ast = {
        type: 'Program',
        body: []
    }
    function walk() {
        let token = tokens[current];
        let type = token.type;
        let value = token.name;
        if (type === 'number') {
            current++;
            return {
                type: 'NumberLiteral',
                value: value
            }
        } else if (type === 'string') {
            current++;
            return {
                type: 'StringLiteral',
                value: value
            }
        } else if (type === 'paren' && value === '(') {
            current++;
            token = tokens[current];
            let node = {
                type: 'CallExpression',
                name: token.name,
                params: []
            };
            current++;
            while (tokens[current].name !== ')') {
                node.params.push(walk());
            }
            current++;
            return node;
        }
    }
    while(current < tokens.length) {
        ast.body.push(walk());
    }

    return ast;
}

/**
 * 接下来就是转换器。我们的转换器会接收我们创造的抽象语法树并将它和一个访问者对象传给traverser
 * 函数。然后创造一个新的抽象语法树。
 *
 * ----------------------------------------------------------------------------
 *   Original AST                     |   Transformed AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *  (sorry the other one is longer.)  |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

function traverser(node, parent) {
    function traverserArray(node, parent) {
        return node.map(v => traverser(v, parent));
    }
    function traverserCode(node, parent) {
        let type = node.type;
        switch(type) {
            case 'Program': 
             traverserArray(node.body, node);
             break;
            case 'CallExpression': 
                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name
                    },
                    arguments: []
                };
                node._context = expression.arguments;
                if (parent.type === 'Program') {
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression
                    }
                    node._context = expression.expression.arguments;
                }
                traverserArray(node.params, node);
                parent._context.push(expression);
                break;
            case "StringLiteral":
                parent._context.push(node);
                break;
            case "NumberLiteral": 
                parent._context.push(node);
                break;
        }
    }
    traverserCode(node, parent);
    delete node._context;
}

/**
 * 代码转换
 * @param { Object } ast 
 */
function transformer(ast) {
    let newAst = {
        type: 'Program',
        body: []
    }
    ast._context = newAst.body;
    traverser(ast, null);
    return newAst;
}

/**
 * 代码生成
 * @param { Object } node 
 */
function codeGenerator(node) {
    let type = node.type;
    switch(type) {
        case 'Program':
            return node.body.map(codeGenerator).join('\n');
        case 'ExpressionStatement':
            return codeGenerator(node.expression);
        case 'CallExpression':
            return node.callee.name + '(' + node.arguments.map(codeGenerator).join(', ') + ')';
        case 'NumberLiteral': 
            return node.value;
        case 'StringLiteral':
            break;
    }
}

/**
 * 编译器
 * @param { String } input 
 */
function compiler(input) {
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let res = codeGenerator(newAst);
    return res;
}

module.exports = {
    tokenizer,
    parser,
    traverser,
    transformer,
    codeGenerator,
    compiler
}