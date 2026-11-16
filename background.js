browser.runtime.onMessage.addListener((req,sender)=>{
 if(req?.type!=="tiv-read"||sender.tab?.id==null)return false;
 return (async()=>{try{
 const tab=sender.tab.id;const get=async()=>{const l=await browser.messageDisplay.getDisplayedMessages(tab);return l.messages||l};
 const list=await get();if(list.length!==1)return null;const msg=list[0];
 const {cal,body}=await TIVExtract(browser.messages,msg.id,await browser.messages.getFull(msg.id));
 if(!cal.length||!/Microsoft Teams|teams\.(?:microsoft\.com|live\.com|cloud\.microsoft)/i.test([...cal,...body].join('\n')))return null;
 const events=[...new Map(cal.flatMap(TIV.parse).map(e=>[JSON.stringify(e),e])).values()];
 const rows=events.map(e=>{const text=[...body,e.description,new DOMParser().parseFromString(e.html,'text/html').body.textContent].join('\n');return {e, warnings:TIVDetails.warnings(text,e), compare:TIV.compare(text,e), recurrence:e.recurring?TIVDetails.recurrence(e):null,links:TIVDetails.links(text+'\n'+e.html)}});
 const current=await get();if(current.length!==1||current[0].id!==msg.id)return null;
 return {subject:msg.subject,rows};
 }catch(e){console.error('TIV auto:',e);return null}})();
});
console.info('TIV: v0.1.8 background started');
try {
  for (const context of ['message_list','tools_menu']) {
    browser.menus.create({id:'tiv-'+context,title:'Teams 招待日時を確認',contexts:[context]},()=>{if(browser.runtime.lastError)console.error('TIV menu:',browser.runtime.lastError.message)});
  }
  browser.menus.onClicked.addListener(async(info,tab)=>{
    if(!String(info.menuItemId).startsWith('tiv-'))return;
    try {
      const selected=info.selectedMessages?.messages;
      const list=selected?.length?selected:(await browser.messageDisplay.getDisplayedMessages(tab?.id)).messages;
      const q=list.length===1?'?messageId='+encodeURIComponent(list[0].id):'?selectionError=1';
      await browser.windows.create({url:browser.runtime.getURL('popup.html')+q,type:'popup',width:520,height:600});
    }catch(e){console.error('TIV menu:',e);await browser.windows.create({url:browser.runtime.getURL('popup.html')+'?selectionError=1',type:'popup',width:520,height:600});}
  });
}catch(e){console.error('TIV menu setup:',e)}
