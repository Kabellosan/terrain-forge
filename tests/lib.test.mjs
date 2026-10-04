import * as L from "../scripts/lib.mjs";
import { STARTER_TABLES } from "../scripts/starter-tables.mjs";
import assert from "node:assert";
for (const [k,p] of Object.entries(L.SIZE_PRESETS)) { const d=L.computeDims(p.w,p.h); console.log(k,d, L.estimateCost("fal-ai/flux-2/flash",d).toFixed(4), L.estimateCost("fal-ai/flux-2-pro",d).toFixed(3));
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
// Shape-based models: nearest shape, trimmed back to the scene.
const med=L.computeDims(20,15), large=L.computeDims(30,20), huge=L.computeDims(40,28);
assert.deepEqual(L.imageRequest("fal-ai/nano-banana-2","p",med),{prompt:"p",num_images:1,output_format:"jpeg",sync_mode:true,aspect_ratio:"4:3",resolution:"2K"});
assert.equal(L.imageRequest("fal-ai/nano-banana-2","p",large).aspect_ratio,"3:2");
assert.equal(L.imageRequest("fal-ai/gpt-image-1.5","p",med).image_size,"1536x1024");
assert.equal(L.imageRequest("fal-ai/gpt-image-1.5","p",L.computeDims(15,20)).image_size,"1024x1536");
assert.equal(L.imageRequest("fal-ai/gpt-image-1.5","p",L.computeDims(12,12)).image_size,"1024x1024");
assert.equal(L.imageRequest("fal-ai/gpt-image-1.5","p",med).quality,"medium");
assert.deepEqual(L.imageRequest("fal-ai/flux-2/flash","p",med).image_size,{width:med.imgW,height:med.imgH});
assert.equal(L.estimateCost("fal-ai/nano-banana-2",huge),0.12);
assert.equal(L.estimateCost("fal-ai/gpt-image-1.5",med),0.05);
assert.equal(L.estimateCost("fal-ai/gpt-image-1.5",L.computeDims(12,12)),0.034);
assert.equal(L.imageSizeLabel("fal-ai/nano-banana-2",med),"4:3 at 2K");
// GPT's 3:2 for a 4:3 scene: trim the sides, keep full height, centred.
assert.deepEqual(L.cropBox(1536,1024,med.sceneW,med.sceneH),{sx:85,sy:0,sw:1365,sh:1024});
assert.equal(L.cropBox(2048,1536,med.sceneW,med.sceneH),null);           // already the right shape
const tall=L.cropBox(1000,1000,2000,1000); assert.deepEqual(tall,{sx:0,sy:250,sw:1000,sh:500});
for (const k of Object.keys(L.MODELS)) assert(L.estimateCost(k,med)>0, k);
console.log("all tests pass");

// Only GPT Image and Nano Banana count as top-down; the default is one of them.
assert.ok(L.isTopDown(L.DEFAULT_MODEL) && L.MODELS[L.DEFAULT_MODEL]);
assert.ok(L.isTopDown("fal-ai/nano-banana-2"));
assert.ok(!L.isTopDown("fal-ai/flux-2/flash") && !L.isTopDown("fal-ai/flux-2-pro") && !L.isTopDown(undefined));
console.log("isTopDown ok");
