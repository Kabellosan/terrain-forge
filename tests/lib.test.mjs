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
console.log("all tests pass");
