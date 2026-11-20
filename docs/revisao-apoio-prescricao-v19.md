# Apoio à Prescrição — revisão v19 (proposta para discussão)
Data: 20-11-2026. Base: versão 18 (23-08-2026), blob cfa2ef377a9127c260faa2002b604018a45fea10.
Estado: desenvolvimento, não validado clinicamente; não publicar em main antes de rever.

## Inventário verificado
- 20 851 linhas de catálogo INFARMED (snapshot 19-08-2026), 440 entradas renais, 657 gravidez, 578 aleitamento.
- DDInter 2.0: 160 235 triplos de índice (480 705 números), 437 aliases globais; export parcial, licença CC BY-NC-SA 4.0 indicada no código. Confirmar condições e direitos antes de eventual exploração comercial.
- 662 regras RCM/EMA de 90 substâncias de origem (38 contraindicações, 183 graves, 391 moderadas, 50 informativas). Contagens não equivalem a cobertura/validação clínica.
- 43 documentos Lote 2 e 142 indicações estruturadas. 118 candidatos decididos (107 integrados/agregados, 11 rejeitados como alertas ativos).

## Prioridade de segurança
1. rcmCheckPair (linhas 910–978 da v18): ruleTargets não inclui classTriggers resolvidos; scan ignora regras sem alvos explícitos. Identificadas 27 regras com classes resolvidas e sem alvos explícitos, incluindo rcm-011c e rcm-052c. Não basta concatenar membros para a lógica ALL: exigir pelo menos um membro de cada grupo obrigatório, nunca todos os membros de uma classe. Não converter nomes de classes em DCI. Rever precedência por especificidade vs gravidade, normalização de DCI, associações fixas e aliases. Manter regras bloqueadas fora dos alertas ativos.
2. DDInter: bestFamKeyForDci escolhe uma via representativa por preço, e resolveDdinterAlias filtra por essa via. Na pesquisa por DCI sem seletor de via, consultar aliases de vias válidos e mostrar maior gravidade encontrada, identificando as vias e limitações. Não inferir ausência de interação. Não alterar a monografia específica sem testar o comportamento.
3. buildStandalonePairs: ordenar pela maior gravidade de alertas ativos RCM e DDInter, sem fundir as fontes em um diagnóstico; regras compostas incompletas são possibilidades, não interações confirmadas.
4. inlineSummaryText e standaloneSummaryText: incluir contexto e compostas por confirmar separadamente, fontes, datas e limitações.
5. localStorage: retirar persistência de medicamentos entre consultas, limpar chave legada e conservar apenas em memória; testar recarregamento e botão de limpeza. Não considerar o sistema autorizado só porque processa localmente.
6. Atualizar preços e datas, confirmar comparabilidade €/unidade e equivalência terapêutica; catálogo comercial não equivale a disponibilidade na farmácia. A dependência XLSX por CDN precisa ser removida/substituída por cópia local auditada para funcionamento plenamente offline. Verificar licença e versão.
7. Interface: informar que DCI não reconhecida não foi avaliada, aceitar todas as substâncias do catálogo com estado sem cobertura, corrigir autocomplete e importação de combinações (não assumir doses/posologias).
8. Revisão documental: verificar atualização e proveniência das fontes, incluindo informação histórica de gravidez; validação clínica por área e fonte.

## Critérios de aceitação (testes com dados fictícios)
| Caso | Resultado esperado |
|---|---|
| Diclofenac + ramipril | Regra de classe IECA quando aplicável, sem depender de DDInter |
| Diclofenac + ramipril + furosemida | rcm-011c ativa; não exigir restantes membros das classes; com apenas dois, composta não confirmada |
| Candesartan + ramipril + espironolactona | rcm-052c ativa; testar permutações e ausência de um grupo |
| Atorvastatina + letermovir + ciclosporina | Regra ALL explícita preservada; não ativar se faltar um fármaco |
| Diclofenac (DCI, sem via) | Não ocultar alerta por escolha da apresentação mais barata; explicitar via e fonte |
| RCM contraindicado, DDInter ausente | Priorizar sobre interações leves; mostrar fonte independente |
| DCI desconhecida | Informar não avaliada; não mostrar como ausência de risco |
| Copiar resumo | Incluir alertas ativos e condições por confirmar com estados distintos |
| Recarregar página | Lista de consulta vazia; sem persistência clínica |
| Preços sem internet | Pesquisa embutida funcional; importação XLSX testada com biblioteca local |
| DCI com associação de substâncias | Reconciliação explícita dos componentes, sem duplicar alertas, testes de nomes e doses |
| Ausência de entradas | Aviso: não exclui interação; sem declaração de segurança |

## Proposta para reunião
- Demonstrar v18 como protótipo de apoio à consulta com fontes e limites; não como sistema validado ou substituto do RCM.
- Decidir responsáveis por revisão clínica, dados INFARMED/RCM, segurança informática e manutenção.
- Priorizar verificador e atualização de dados, depois importação de medicação habitual, ajuste renal contextual e criação de esquema terapêutico exportável.
- MGF no Plural: aproveitar organização por patologia, biblioteca de templates e normalização de posologia; não importar conteúdo terapêutico sem validação de fontes e licenças.
- Propor piloto com casos fictícios, dupla revisão clínica e teste de regressão antes de qualquer publicação.
- Avaliar finalidade prevista e enquadramento regulamentar antes de oferecer recomendações individualizadas; verificar licenças específicas dos dados (DDInter não comercial), não apenas licença do código.

## Arquitetura futura
Separar dados versionados (preços, RCM, renal, gravidez, aleitamento, DDInter), lógica determinística, interface e testes. Manter HTML autónomo gerado como artefacto de distribuição. Não integrar dados clínicos reais, serviços externos ou automação SClínico sem autorização.
