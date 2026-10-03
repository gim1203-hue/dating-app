import {siteUrl} from '../site';
import React,{useEffect,useState} from 'react';
import {resendConfirmation} from '../auth';
export default function ConfirmationHelp({auth,email,busy,act,feedback}){
 const [remaining,setRemaining]=useState(0);
 useEffect(()=>{if(!remaining)return;const timer=setTimeout(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer)},[remaining]);
 return <section className="confirmation-help"><h3>Missing the confirmation email?</h3><p>Check Spam and All Mail. Make sure the email address above is correct, then request a new confirmation link.</p><button type="button" className="secondary" disabled={busy||remaining>0||!email.trim()} onClick={()=>act(async()=>{const message=await resendConfirmation(auth,email,siteUrl());setRemaining(60);feedback(message,'info')})}>{remaining?`Try again in ${remaining}s`:'Resend confirmation email'}</button><p className="fine">Already confirmed? Use Sign in. If the email still doesn’t arrive, contact the website owner to check delivery.</p></section>;
}
