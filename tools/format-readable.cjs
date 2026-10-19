// Preserve the AST exactly; split long CSS string literals into constant rule strings.
const fs=require('fs'),acorn=require('acorn'),gen=require('escodegen'),assert=require('node:assert/strict');
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object'){let result={};for(const key of Object.keys(value).sort())if(!['start','end','range','raw','verbatimCss'].includes(key))result[key]=canonical(value[key]);if(result.type==='BinaryExpression'&&result.operator==='+'&&result.left.type==='Literal'&&result.right.type==='Literal'&&typeof result.left.value==='string'&&typeof result.right.value==='string')return{type:'Literal',value:result.left.value+result.right.value};return result}return value}
function mark(node){if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.value==='string'&&node.value.length>500&&node.value.includes('{'))node.verbatimCss={content:node.value.match(/[^}]*}(?:;)?|[^}]+$/g).map(s=>JSON.stringify(s)).join(' +\n'),precedence:gen.Precedence.Additive};for(const key of Object.keys(node))if(key!=='verbatimCss'){const child=node[key];if(Array.isArray(child))child.forEach(mark);else if(child&&typeof child==='object')mark(child)}}
const manifest=JSON.parse(fs.readFileSync('manifest.json'));
for(const file of [...manifest.modules.filter(m=>m.type==='js').map(m=>m.path),'apps/youtube3/player-beta56-3.js']){
 const source=fs.readFileSync(file,'utf8'),ast=acorn.parse(source,{ecmaVersion:5});mark(ast);
 const output='/* RemoteTV beta 3. ES5 source; compatibility aliases are intentional. */\n'+gen.generate(ast,{verbatim:'verbatimCss',format:{indent:{style:'    '},quotes:'single'}})+'\n';
 assert.deepEqual(canonical(acorn.parse(output,{ecmaVersion:5})),canonical(ast),file+' AST changed');fs.writeFileSync(file,output);
}
console.log('PASS readable ES5 formatting preserves each final runtime AST and constant CSS value');
