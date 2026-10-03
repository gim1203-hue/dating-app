import test from 'node:test';
import assert from 'node:assert/strict';
import {siteUrl} from '../src/site.js';
test('GitHub Pages auth redirects and invite links retain the repository path',()=>{
 const url=siteUrl('https://gim1203-hue.github.io','/dating-app/');
 assert.equal(url,'https://gim1203-hue.github.io/dating-app/');
 assert.equal(new URL('?auth=signup',url).href,'https://gim1203-hue.github.io/dating-app/?auth=signup');
 assert.equal(`${url}?ref=invite`,'https://gim1203-hue.github.io/dating-app/?ref=invite');
 assert.equal(siteUrl('http://127.0.0.1:5180','/'),'http://127.0.0.1:5180/');
});
