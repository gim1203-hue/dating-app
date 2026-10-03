export async function resendConfirmation(auth,email,origin){
 const address=email.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw Error('Enter your signup email address above first.');
 const result=await auth.resend({type:'signup',email:address,options:{emailRedirectTo:origin}});
 if(result.error)throw result.error;
 return 'Confirmation request accepted. Check Spam and All Mail too. If nothing arrives, the website owner needs to check email delivery settings.';
}
