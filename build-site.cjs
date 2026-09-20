const fs=require('node:fs'),path=require('node:path');
const files=['index.html','style.css','three.js','model.js','app.js','workspace-ui.js','booth-model.js','booth-tools.js','accessories.js','product-art.js','THREE-LICENSE.txt','.nojekyll'];
const out=path.join(__dirname,'_site');fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const asset=match[1].split('?')[0];if(asset.startsWith('/')||asset.includes('://')||!files.includes(asset))throw Error('Nonportable or unpackaged asset: '+asset);}
for(const file of files)fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
console.log('Packaged '+files.length+' public files in _site.');

fs.cpSync(path.join(__dirname,'display-editor'),path.join(out,'display-editor'),{recursive:true});
