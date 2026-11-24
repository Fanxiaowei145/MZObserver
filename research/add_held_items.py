import sys
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
env=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets')
items={1003:'GrenadeFlash',1064:'GrenadeHE',1322:'Medkit',1701:'Radio',1297:'COM15',1834:'Crossvec',1638:'FRMG0',832:'FSP9',1140:'AK',1203:'Revolver',884:'Shotgun',1627:'Logicer',1325:'COM18',1496:'COM45',1646:'Adrenaline',1566:'Painkillers',1345:'Flashlight',602:'SCP127',995:'ShotgunAutomatic'}
for o in env.objects:
    if o.path_id in items:o.read().image.save(Path('assets/official')/(items[o.path_id]+'.png'))
p=Path('ui/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("armor:'ArmorLight',held:'E11SR',ammo:18,magazineCapacity:30", "armor:'ArmorLight',held:'GrenadeFlash',ammo:null,magazineCapacity:null")
s=s.replace("armor:'ArmorLight',held:'Jailbird',ammo:null", "armor:'ArmorLight',held:'GrenadeHE',ammo:null")
s=s.replace("H04:{effects:['invisible'],", "H04:{effects:['invisible'],")
# Expose the exact same card-rendering path for a future authenticated server adapter.
s += '''
window.MZUI={
  applyPlayers(players){
    if(!Array.isArray(players)||players.length!==9)throw Error('Expected fixed 6+3 roster');
    const ids=players.map(p=>p.id);
    if(new Set(ids).size!==9||ids.some(id=>!cards.has(id)))throw Error('Invalid roster slots');
    for(const p of players){
      if(!roles[p.role]||!Number.isFinite(p.hp)||!(p.maxHp>0))throw Error('Invalid player state');
      if(p.id.startsWith('S')&&(!(p.maxHs>=0)||!(p.hs>=0)))throw Error('Invalid shield state');
    }
    players.forEach(updateCard);window.currentSnapshot=players;
  },
  setScore(human,scp){
    if(!Number.isInteger(human)||!Number.isInteger(scp)||human<0||scp<0)throw Error('Invalid score');
    const scores=document.querySelectorAll('#score strong');scores[0].textContent=human;scores[1].textContent=scp;
  },
  setAuthorized(authorized){document.getElementById('stage').hidden=!authorized;},
  note:'Renderer only. Authorization and sensitive-data filtering must be enforced on the server.'
};
'''
p.write_text(s,encoding='utf-8')
