const assert = require('assert');

const {tokenizer, parser, transformer, compiler} = require('./compiler');

const input = '(add 2 (subtract 4 2))';
const output = 'add(2, subtract(4, 2))';

const tokens = [ { type: 'paren', name: '(' },
{ type: 'name', name: 'add' },
{ type: 'number', name: '2' },
{ type: 'paren', name: '(' },
{ type: 'name', name: 'subtract' },
{ type: 'number', name: '4' },
{ type: 'number', name: '2' },
{ type: 'paren', name: ')' },
{ type: 'paren', name: ')' } ];

const ast = {
    type: 'Program',
    body: [{
      type: 'CallExpression',
      name: 'add',
      params: [{
        type: 'NumberLiteral',
        value: '2'
      }, {
        type: 'CallExpression',
        name: 'subtract',
        params: [{
          type: 'NumberLiteral',
          value: '4'
        }, {
          type: 'NumberLiteral',
          value: '2'
        }]
      }]
    }]
  };

  const newAst = {
      type: 'Program',
      body: [
          {
              type: 'ExpressionStatement',
              expression: {
                  type: 'CallExpression',
                  callee: {
                      type: 'Identifier',
                      name: 'add'
                  },
                  arguments: [
                      {
                          type: 'NumberLiteral',
                          value: '2'
                      },
                      {
                          type: 'CallExpression',
                          callee: {
                              type: 'Identifier',
                              name: 'subtract'
                          },
                          arguments: [
                              {
                                type: 'NumberLiteral',
                                value: '4'
                              },
                              {
                                type: 'NumberLiteral',
                                value: '2'
                              }
                          ]
                      }
                  ]
              }
          }
      ]
  }
//词素分析
assert.deepStrictEqual(tokenizer(input), tokens, 'tokenizer should turn `input` to `tokens`');
//语法分析
assert.deepStrictEqual(parser(tokens), ast, 'parser should turn `tokens` to `ast`');
//转换器
assert.deepStrictEqual(transformer(ast), newAst, 'transformer should turn `ast` to `newAst`');
// 编译器
assert.deepStrictEqual(compiler(input), output, 'compiler should turn input into output');


console.log('All Passed');