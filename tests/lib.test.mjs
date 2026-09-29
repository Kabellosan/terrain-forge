import * as L from "../scripts/lib.mjs";
import { STARTER_TABLES } from "../scripts/starter-tables.mjs";
import assert from "node:assert";
for (const [k,p] of Object.entries(L.SIZE_PRESETS)) { const d=L.computeDims(p.w,p.h); console.log(k,d, L.estimateCost("fal-ai/flux-2/flash",d.imgW,d.imgH).toFixed(4), L.estimateCost("fal-ai/flux-2-pro",d.imgW,d.imgH).toFixed(3));
  assert(d.gridPx>=50 && d.imgW<=2048 && d.imgH<=2048 && d.imgW>=512 && d.imgH>=512); }
assert.deepEqual(L.parseTableName("Forest: Hazards (hidden)"),{biome:"Forest",category:"Hazards",hidden:true});
assert.deepEqual(L.parseTableName("Cave | Cover"),{biome:"Cave",category:"Cover",hidden:false});
assert.equal(L.parseTableName("Loot"),null);
assert.equal(L.parseRolls("Rolls: 2. blah"),2); assert.equal(L.parseRolls(""),1);
const p=L.buildPrompt({biome:"Forest",features:["a fallen oak","a shrine"],style:"painterly"});
console.log(p); assert(!p.includes("Snare"));
for (const t of STARTER_TABLES){ const n=`${t.biome}: ${t.category}${t.hidden?" (hidden)":""}`; const pr=L.parseTableName(n); assert.equal(pr.hidden,t.hidden); assert(t.results.every(r=>r.name&&r.effect)); }
console.log("tables", STARTER_TABLES.length, "results", STARTER_TABLES.reduce((a,t)=>a+t.results.length,0));
// Setting line: a named biome reaches the model as a paintable description.
assert.equal(L.parseSetting("<p>Rolls: 1</p><p>Setting: an ancient oak forest.</p>"),"an ancient oak forest");
assert.equal(L.parseSetting("<p>Setting: the woodcutter&#39;s wood</p>"),"the woodcutter's wood");
assert.equal(L.parseSetting("<p>Rolls: 2</p>"),"");
const ps=L.buildPrompt({biome:"Magna Woods",setting:"an ancient oak forest",features:[],style:""});
assert(ps.includes("Setting: an ancient oak forest.") && !ps.includes("magna"));
// Table definitions: checked, tidied, and round-tripped through the description.
const defs=L.normalizeTableDefs({tables:[{biome:" Vale ",category:"Cover",rolls:"2",setting:"a wood",results:[{name:"a log"}]}]});
assert.deepEqual(defs[0],{biome:"Vale",category:"Cover",hidden:false,rolls:2,folder:"",blurb:"",setting:"a wood",results:[{name:"a log",effect:""}]});
assert.equal(L.parseRolls(L.stripHTML(L.tableDescription(defs[0]))),2);
assert.equal(L.parseSetting(L.tableDescription(defs[0])),"a wood");
assert.equal(L.tableName({biome:"Vale",category:"Traps",hidden:true}),"Vale: Traps (hidden)");
assert.throws(()=>L.normalizeTableDefs({}),/list of tables/);
assert.throws(()=>L.normalizeTableDefs([{biome:"A:B",category:"C",results:[{name:"x"}]}]),/can't contain/);
assert.throws(()=>L.normalizeTableDefs([{biome:"A",category:"C",results:[]}]),/no results/);
assert.throws(()=>L.normalizeTableDefs([{biome:"A",category:"C",results:[{effect:"x"}]}]),/result 1 has no name/);
assert.equal(L.normalizeTableDefs(STARTER_TABLES).length,STARTER_TABLES.length);
assert.equal(L.gistId("https://gist.github.com/Kabellosan/aeee2777f3917151ed9d4580c4fdc578"),"aeee2777f3917151ed9d4580c4fdc578");
assert.equal(L.gistId(" https://gist.github.com/aeee2777f3917151ed9d4580c4fdc578/ "),"aeee2777f3917151ed9d4580c4fdc578");
assert.equal(L.gistId("https://gist.githubusercontent.com/Kabellosan/aeee2777f3917151ed9d4580c4fdc578/raw/x.json"),null);
assert.equal(L.gistId("https://example.com/tables.json"),null);
assert(L.isEmptyTableList([]) && L.isEmptyTableList({tables:[]}) && !L.isEmptyTableList({}));
console.log("all tests pass");
