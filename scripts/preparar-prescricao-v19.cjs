/* V19 experimental — mudanças técnicas; não altera as bases clínicas.
 * Executar na raiz do repositório: node scripts/preparar-prescricao-v19.cjs
 * Gera comparador-medicamentos-v19-preview.html, não modifica o ficheiro publicado.
 * Para verificar sem criar ficheiro: node scripts/preparar-prescricao-v19.cjs --check
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const source = fs.readFileSync('comparador-medicamentos.html','utf8');
let html = source;
function replaceOnce(before,after){
  assert.equal(html.split(before).length,2,'Âncora inesperada: '+before.slice(0,100));
  html=html.replace(before,()=>after);
}
assert.ok(html.includes('comparador-medicamentos-18 | 2026-08-23'),'Aplicar apenas à versão 18');
replaceOnce('comparador-medicamentos-18 | 2026-08-23','comparador-medicamentos-19-preview | 2026-11-20');
replaceOnce('⚠️ Ferramenta em fase de teste — ainda sem validação institucional formal.', '⚠️ V19 experimental — apenas para testes com dados fictícios. Sem validação clínica ou institucional.');
const start=html.indexOf('/* Persistido em localStorage');
const end=html.indexOf('function renderInteractionStandalone(){',start);
assert.ok(start>=0&&end>start);
html=html.slice(0,start)+
"/* Lista temporária: não recuperar nem persistir medicação entre consultas. */\n"+
"try { localStorage.removeItem('apoioPrescricao.ddiStandaloneList.v1'); } catch(e) {}\n"+
"let ddiStandaloneList = []; // apenas em memória\n"+html.slice(end);
const persistCalls=html.match(/^[ \t]*saveDdiStandaloneList\(\);[ \t]*\r?\n/gm)||[];
assert.equal(persistCalls.length,3);
html=html.replace(/^[ \t]*saveDdiStandaloneList\(\);[ \t]*\r?\n/gm,'');
replaceOnce('Adiciona pelo menos 2 fármacos para veres os pares.', 'Adiciona pelo menos 2 fármacos para veres os pares. A lista é temporária e fica vazia ao recarregar a página.');
const sortStart=html.indexOf('  // graves primeiro, depois moderadas');
const sortEnd=html.indexOf('  return pairs;',sortStart);
assert.ok(sortStart>=0&&sortEnd>sortStart);
const sortCode=[
"  // Prioridade de leitura, não uma classificação clínica agregada.",
"  // Regras compostas incompletas nunca contam como interação ativa.",
"  const severityRank = {contraindicado:4, grave:3, moderada:2, informativa:0};",
"  function priority(p){",
"    const rcm = p.rcm || {};",
"    const active = Math.max(-1, p.result.status==='found' ? p.result.rank : -1, ...(rcm.confirmed||[]).map(r=>severityRank[r.severity]??0));",
"    const context = Math.max(-1, ...(rcm.pendingContext||[]).map(r=>severityRank[r.severity]??0));",
"    return [Math.max(active,context),active,context,(rcm.pendingComposite||[]).length?1:0,p.result.status==='unmapped'?1:0];",
"  }",
"  pairs.sort((a,b)=>{const x=priority(a),y=priority(b); for(let i=0;i<x.length;i++) if(x[i]!==y[i])return y[i]-x[i];return 0;});",
].join('\n')+'\n';
html=html.slice(0,sortStart)+sortCode+html.slice(sortEnd);
const summaryOriginal=[
"    for(const r of p.rcm.confirmed){",
"      lines.push(\x60  RCM/EMA (\x24{r.sourceSubstance} -> \x24{r.triggerValue}): \x24{RCM_SEVERITY_LABEL[r.severity]||r.severity} — \x24{r.clinicalConsequence}\x60);",
"      lines.push(\x60    Gestão: \x24{r.managementRecommendation}\x60);",
"    }",
].join('\n');
const summaryUse="    appendRcmSummary(lines,p.rcm);";
assert.equal(html.split(summaryOriginal).length,3);
html=html.split(summaryOriginal).join(summaryUse);
const helper=[
"function appendRcmSummary(lines,rcm){",
"  function emit(r,status){",
"    lines.push('  RCM/EMA ['+status+'] ('+r.sourceSubstance+' → '+r.triggerValue+'): '+(RCM_SEVERITY_LABEL[r.severity]||r.severity)+' — '+(r.clinicalConsequence||''));",
"    if(r.routes&&r.routes.length) lines.push('    Vias documentadas: '+r.routes.join(', ')+'; confirmar apresentação concreta.');",
"    if(r.formulation) lines.push('    Formulação documentada: '+r.formulation);",
"    if(r.__missingSubstances&&r.__missingSubstances.length)lines.push('    Falta confirmar: '+r.__missingSubstances.join(', '));",
"    if(r.managementRecommendation) lines.push('    Gestão descrita na fonte (apenas se aplicável): '+r.managementRecommendation);",
"    lines.push('    Fonte: '+(r.source||'não indicada')+' · revisão: '+(r.reviewDate||'não indicada')+(r.sourceUrl?' · '+r.sourceUrl:''));",
"  }",
"  for(const r of rcm.confirmed||[])emit(r,'alerta identificado — confirmar aplicabilidade clínica');",
"  for(const r of rcm.pendingContext||[])emit(r,'contexto/indicação por confirmar — não confirmado');",
"  for(const r of rcm.pendingComposite||[])emit(r,'associação composta incompleta — não confirmada');",
"}",
].join('\n')+'\n';
replaceOnce('function inlineSummaryText(){',helper+'function inlineSummaryText(){');
const disclaimerOld='Gerado localmente pela app Apoio à Prescrição — não substitui a leitura do RCM nem o critério clínico.';
const disclaimerNew='Apoio à Prescrição v19 experimental — cobertura parcial DDInter/RCM. A ausência de alertas não exclui interações. Confirmar fontes, apresentação e contexto clínico; não substitui a leitura do RCM nem o critério clínico.';
assert.equal(html.split(disclaimerOld).length,3);
html=html.split(disclaimerOld).join(disclaimerNew);
// Verificar sintaxe e preservação literal dos dados incorporados.
const scripts = s=>Array.from(s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g));
const embedded=s=>scripts(s).filter(m=>m[1].includes('application/json')).map(m=>m[0]);
assert.deepEqual(embedded(html),embedded(source));
const js=scripts(html).filter(m=>!m[1].includes('application/json')&&!m[1].includes('src=')).map(m=>m[2]);
for(const body of js)new vm.Script(body);
assert.ok(!html.includes('saveDdiStandaloneList('));
assert.ok(!html.includes('localStorage.setItem('));
assert.ok(!html.includes('localStorage.getItem('));
// Testar ordenação e cópia com um contexto isolado, sem executar a interface.
const ctx=vm.createContext({RCM_SEVERITY_LABEL:{contraindicado:'Contraindicado',grave:'Grave'},ddinterCheckPair:(a,b)=>a==='A'&&b==='B'?{status:'found',rank:1}:{status:'not_found'},rcmCheckPair:(a,b)=>({confirmed:a==='B'&&b==='C'?[{severity:'contraindicado'}]:[],pendingContext:[],pendingComposite:[]})});
const fStart=html.indexOf('function buildStandalonePairs(');
const fEnd=html.indexOf('/* Cópia para clipboard',fStart);
new vm.Script(html.slice(fStart,fEnd)+'\n'+helper).runInContext(ctx);
const pairs=vm.runInContext("buildStandalonePairs([{dci:'A'},{dci:'B'},{dci:'C'}])",ctx);
assert.equal(pairs[0].a,'B');assert.equal(pairs[0].b,'C');
const lines=[];
ctx.output=lines;
vm.runInContext("appendRcmSummary(output,{confirmed:[],pendingContext:[{sourceSubstance:'X',triggerValue:'Y',severity:'grave',source:'Fonte-teste'}],pendingComposite:[{sourceSubstance:'X',triggerValue:'Z',severity:'grave',__missingSubstances:['W']}]})",ctx);
assert.match(lines.join('\n'),/contexto\/indicação por confirmar/);
assert.match(lines.join('\n'),/associação composta incompleta/);
assert.match(lines.join('\n'),/Falta confirmar: W/);
assert.match(lines.join('\n'),/Fonte-teste/);
console.log('OK: âncoras únicas, bases de dados intactas, sintaxe, ausência de persistência, ordenação e resumo (testes isolados).');
if(!process.argv.includes('--check')){
  fs.writeFileSync('comparador-medicamentos-v19-preview.html',html,'utf8');
  console.log('Gerado comparador-medicamentos-v19-preview.html. Apenas para testes fictícios.');
}
