import sys,json,math
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
from PIL import Image
import numpy as np
e=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets')
items={948:'SCP018',706:'Coin',709:'SCP1576',1032:'SCP244b',1667:'SCP244a',1077:'Coal',1246:'MarshmallowItem',1289:'Snowball',1447:'A7',1470:'SCP1507Tape',1507:'SCP2176',1664:'Scp021J',1709:'SCP330',1747:'Lantern',907:'Ammo556x45',1071:'Ammo12gauge',1495:'Ammo9x19',1609:'Ammo44cal',1807:'Ammo762x39'}
for o in e.objects:
 if o.path_id in items:o.read().image.save(Path('assets/official')/(items[o.path_id]+'.png'))
alias={x:'Gun'+x for x in ['COM15','COM18','Crossvec','FSP9','Logicer','Revolver','AK','Shotgun','FRMG0','A7','SCP127']}
alias.update({'E11SR':'GunE11SR','COM45':'GunCom45','1509Icon':'SCP1509','SCP207Icon':'SCP207','SCP207Icon 1':'AntiSCP207','SCP1853Icon':'SCP1853'})
plain=['Radio','Medkit','Flashlight','MicroHID','SCP500','GrenadeHE','GrenadeFlash','SCP268','Adrenaline','Painkillers','ParticleDisruptor','Jailbird','SCP1344','ArmorLight','ArmorCombat','ArmorHeavy']+list(items.values())
names={n:n for n in plain}; names.update({k:v for k,v in alias.items()})
result={}
for asset,item in names.items():
 im=Image.open('assets/official/'+asset+'.png').convert('RGBA'); a=np.asarray(im)[:,:,3]
 threshold=8 if item=='SCP2176' else 128
 ys,xs=np.where(a>threshold)
 # Angles measured from the visible barrel axis, never from whole-image PCA.
 rotation={'MicroHID':34,'ParticleDisruptor':38,'Jailbird':45,'GunA7':43,'GunCOM15':8,'GunCOM18':7,'GunCrossvec':11,'GunFSP9':18,'GunLogicer':40,'GunRevolver':27,'GunAK':41,'GunShotgun':40,'GunFRMG0':43,'GunSCP127':13,'GunE11SR':42,'GunCom45':4.5}
 angle=-rotation.get(item,0)
 th=math.radians(-angle); xx=xs*math.cos(th)-ys*math.sin(th); yy=xs*math.sin(th)+ys*math.cos(th)
 result[item]={'asset':asset,'size':list(im.size),'box':[round(float(xx.min())-2,2),round(float(yy.min())-2,2),round(float(xx.max()-xx.min())+4,2),round(float(yy.max()-yy.min())+4,2)],'angle':round(-angle,2),'alphaCutoff':threshold/255,'wide':item.startswith('Gun') or item in ['MicroHID','ParticleDisruptor','Jailbird']}
result['SpecialCoal']={**result['Coal']}
colors=json.load(open('research/keycard-colors.json')); mapping={'KeycardCaptain':'KeycardMTFCaptain','KeycardOperative':'KeycardMTFOperative','KeycardPrivate':'KeycardMTFPrivate','KeycardResearchSupervisor':'KeycardResearchCoordinator'}
for k,v in colors.items():result[mapping.get(k,k)]={'card':True,'color':v}
for k,v in {'KeycardO5':'#18191e','KeycardChaosInsurgency':'#3c7854','SurfaceAccessPass':'#e6ac4c','KeycardCustomTaskForce':'#729dff','KeycardCustomSite02':'#fff19e','KeycardCustomManagement':'#9f164f','KeycardCustomMetalCase':'#b8c1ca'}.items():result[k]={'card':True,'color':v}
Path('ui/item-data.js').write_text('window.MZ_ITEMS='+json.dumps(result,separators=(',',':'))+';\nwindow.MZ_ITEM_ALIASES='+json.dumps({**alias,'SCP207Icon 1':'AntiSCP207'},separators=(',',':'))+';',encoding='utf8')
print('Catalog entries:',len(result))
