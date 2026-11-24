window.MZDisplayName=name=>String(name??'').replace(/^(?:\[(?:NTF|SCP)\]\s*)+/i,'');
(()=>{const render=window.updateCard;window.updateCard=p=>render({...p,name:MZDisplayName(p.name)});})();
