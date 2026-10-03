import test from 'node:test';
import assert from 'node:assert/strict';
import {resendConfirmation} from '../src/auth.js';
test('confirmation resend validates email before requesting delivery',async()=>{
 let called=false;await assert.rejects(resendConfirmation({resend:async()=>{called=true}},'bad','http://localhost:5180'),/signup email/);assert.equal(called,false);
});
test('confirmation resend uses signup endpoint and current origin without claiming delivery',async()=>{
 let request;const message=await resendConfirmation({resend:async data=>{request=data;return {error:null}}},' person@example.com ','http://localhost:5180');
 assert.deepEqual(request,{type:'signup',email:'person@example.com',options:{emailRedirectTo:'http://localhost:5180'}});
 assert.match(message,/request accepted/);assert.match(message,/email delivery settings/);
});
test('confirmation resend propagates delivery and rate-limit errors',async()=>{
 const error=Error('Email rate limit exceeded');await assert.rejects(resendConfirmation({resend:async()=>({error})},'person@example.com','http://localhost:5180'),/rate limit/);
});
