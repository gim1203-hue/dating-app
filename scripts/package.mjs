import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
// A simple uncompressed ZIP writer with portable forward-slash entries.
const root=path.resolve('dist');const entries=[];
async function visit(dir){for(const item of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory())await visit(full);else entries.push({name:path.relative(root,full).split(path.sep).join('/'),data:await readFile(full)})}}
await visit(root);
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
let offset=0;const local=[],central=[];
for(const entry of entries){const name=Buffer.from(entry.name),crc=crc32(entry.data),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt32LE(crc,14);header.writeUInt32LE(entry.data.length,18);header.writeUInt32LE(entry.data.length,22);header.writeUInt16LE(name.length,26);local.push(header,name,entry.data);const index=Buffer.alloc(46);index.writeUInt32LE(0x02014b50);index.writeUInt16LE(20,4);index.writeUInt16LE(20,6);index.writeUInt16LE(0x800,8);index.writeUInt32LE(crc,16);index.writeUInt32LE(entry.data.length,20);index.writeUInt32LE(entry.data.length,24);index.writeUInt16LE(name.length,28);index.writeUInt32LE(offset,42);central.push(index,name);offset+=header.length+name.length+entry.data.length}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);await mkdir('release',{recursive:true});await writeFile('release/after-hours-finished.zip',Buffer.concat([...local,directory,end]));console.log('Packaged '+entries.map(e=>e.name).join(', '));
