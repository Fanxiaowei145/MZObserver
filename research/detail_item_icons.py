from pathlib import Path
import json,base64,math,shutil
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
p=root/'ui/item-data.js';src=p.read_text(encoding='utf-8');data=json.loads(src.split('window.MZ_ITEMS=')[1].split(';')[0]);aliases=src.split(';',1)[1]
# The source bundle already contains the extracted original icon.
if (root/'output/icon-detail-audit/jailbird-1194.png').exists():
 shutil.copy2(root/'output/icon-detail-audit/jailbird-1194.png',root/'assets/official/JailbirdOriginal.png')
d=data['Jailbird'];d['asset']='JailbirdOriginal';d['angle']=45
im=Image.open(root/'assets/official/JailbirdOriginal.png');ys,xs=np.where(np.asarray(im)[:,:,3]>128);rx=(xs-ys)*math.sqrt(.5);ry=(xs+ys)*math.sqrt(.5);d['box']=[round(float(rx.min()),2),round(float(ry.min()),2),round(float(rx.max()-rx.min()+1),2),round(float(ry.max()-ry.min()+1),2)]
# Detail paths use original 512px artwork coordinates; mask holes remain transparent.
details={
'Medkit':'<path fill="black" d="M259 138L290 132L299 185L350 176L357 210L305 219L315 270L280 277L271 225L219 234L213 198L265 190Z"/>',
'Flashlight':'<ellipse cx="405" cy="77" rx="64" ry="27" transform="rotate(43 405 77)"/>',
'SCP500':'<path d="M164 156Q247 162 326 191L270 424Q191 435 108 395Z"/>',
'GrenadeHE':'<path d="M104 244Q207 322 366 369M225 148Q288 141 351 176"/><ellipse cx="314" cy="78" rx="53" ry="32" transform="rotate(-35 314 78)"/>',
'GrenadeFlash':'<path d="M238 126Q312 139 374 181M105 383Q172 423 246 442"/><ellipse cx="371" cy="89" rx="52" ry="30" transform="rotate(25 371 89)"/>',
'SCP268':'<path d="M45 196Q224 286 422 242M157 322Q275 338 408 305"/><path d="M94 252L134 254L143 320L102 320Z"/>',
'Adrenaline':'<path fill="black" stroke="none" d="M149 153Q165 131 183 145L286 248Q298 262 278 282L263 290Q250 295 239 281L142 186Q132 169 149 153Z"/>',
'Jailbird':'<path d="M76 194L212 140L232 192L96 245ZM230 236L264 276M111 356L157 390"/><g fill="black" stroke="none"><circle cx="349" cy="54" r="10"/><circle cx="407" cy="80" r="10"/><circle cx="454" cy="122" r="10"/><circle cx="374" cy="152" r="10"/><circle cx="318" cy="112" r="10"/><circle cx="419" cy="195" r="10"/><circle cx="331" cy="200" r="10"/></g>',
'SCP1344':'<ellipse cx="119" cy="269" rx="78" ry="94" transform="rotate(28 119 269)"/><ellipse cx="341" cy="141" rx="81" ry="89" transform="rotate(32 341 141)"/><path d="M194 215Q219 192 245 194"/>',
'Coin':'<text x="256" y="272" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="900" font-size="260" fill="black" stroke="none">$</text>',
'SCP2176':'<path d="M150 348L211 375M136 379L195 408M123 407L179 434M185 322L240 207L278 219L226 343"/>',
'GunCom45':'<path d="M108 184L382 137M168 322Q201 337 247 306M104 338L202 314M99 364L188 342M93 389L175 368"/><g fill="black" stroke="none"><ellipse cx="430" cy="116" rx="10" ry="19" transform="rotate(-22 430 116)"/><ellipse cx="455" cy="128" rx="10" ry="19" transform="rotate(-22 455 128)"/><ellipse cx="479" cy="141" rx="10" ry="19" transform="rotate(-22 479 141)"/></g>'}
def svg(key,detail='',color=None):
 d=data[key];raw=root/'assets/official'/(d['asset']+'.png');im=Image.open(raw);w,h=im.size;uri='data:image/png;base64,'+base64.b64encode(raw.read_bytes()).decode();b=' '.join(map(str,d['box']));angle=d['angle'];content=f'<image width="{w}" height="{h}" href="{uri}" filter="url(#white)"/>'
 if color:content+=f'<g mask="url(#alpha)"><g transform="scale({w/512} {h/512})">{color}</g></g>'
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{b}"><defs><filter id="white" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 {20 if key=='SCP2176' else 1} 0"/></filter><mask id="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="{w}" height="{h}"><image width="{w}" height="{h}" href="{uri}" filter="url(#white)"/></mask><mask id="detail" maskUnits="userSpaceOnUse" x="0" y="0" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="white"/><g transform="scale({w/512} {h/512})" fill="none" stroke="black" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">{detail}</g></mask></defs><g transform="rotate({angle})"><g mask="url(#detail)">{content}</g></g></svg>'
for key,detail in details.items():(root/'assets/items'/(key+'.svg')).write_text(svg(key,detail),encoding='utf-8')
status=root/'assets/status';status.mkdir(exist_ok=True)
colors={'SCP1853':'<path fill="#80bc43" d="M68 213L414 386L380 450L32 276Z"/>','SCP207':'<path fill-rule="evenodd" fill="#86553e" d="M0 67L512 206L512 512L0 512Z M0 152L512 346L512 410L0 216Z"/>','AntiSCP207':'<path fill-rule="evenodd" fill="#da75b6" d="M0 70L512 209L512 512L0 512Z M0 154L512 348L512 412L0 218Z"/>'}
for key,color in colors.items():(status/(key+'.svg')).write_text(svg(key,color=color),encoding='utf-8')
p.write_text('window.MZ_ITEMS='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';'+aliases,encoding='utf-8')
print('12 detailed item icons and 3 colored status icons generated')
