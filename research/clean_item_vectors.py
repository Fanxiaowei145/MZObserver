from pathlib import Path
import json,math
from collections import deque,defaultdict
import numpy as np
from PIL import Image
s=Path('ui/item-data.js').read_text();data=json.loads(s.split('window.MZ_ITEMS=')[1].split(';')[0])
for name,d in data.items():
 if not (d.get('wide') or name=='SCP2176' or name.startswith('Ammo')):continue
 alpha=np.asarray(Image.open('assets/official/'+d['asset']+'.png'))[:,:,3];mask=alpha>(8 if name=='SCP2176' or name.startswith('Ammo') else 128);h,w=mask.shape;seen=np.zeros_like(mask);groups=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  q=deque([(x,y)]);seen[y,x]=True;group=[]
  while q:
   xx,yy=q.popleft();group.append((xx,yy))
   for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
    if 0<=nx<w and 0<=ny<h and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((nx,ny))
  groups.append(group)
 cutoff=max(40,max(map(len,groups))*.002);clean=np.zeros_like(mask)
 for group in groups:
  if len(group)>=cutoff:
   for x,y in group:clean[y,x]=True
 edges=defaultdict(list)
 for y,x in zip(*np.where(clean)):
  if y==0 or not clean[y-1,x]:edges[(x,y)].append((x+1,y))
  if x==w-1 or not clean[y,x+1]:edges[(x+1,y)].append((x+1,y+1))
  if y==h-1 or not clean[y+1,x]:edges[(x+1,y+1)].append((x,y+1))
  if x==0 or not clean[y,x-1]:edges[(x,y+1)].append((x,y))
 paths=[]
 while edges:
  start=next(iter(edges));cur=start;points=[start]
  while True:
   nxt=edges[cur].pop()
   if not edges[cur]:del edges[cur]
   cur=nxt
   if cur==start:break
   points.append(cur)
  # Drop intermediate points along straight pixel-edge runs.
  simple=[]
  for i,p in enumerate(points):
   prev=points[i-1];nxt=points[(i+1)%len(points)]
   if (p[0]-prev[0],p[1]-prev[1])!=(nxt[0]-p[0],nxt[1]-p[1]):simple.append(p)
  paths.append('M'+'L'.join(f'{x},{y}' for x,y in simple)+'Z')
 box=' '.join(map(str,d['box']));svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}"><path fill="white" fill-rule="evenodd" transform="rotate({d["angle"]})" d="{"".join(paths)}"/></svg>'
 Path('assets/items',name+'.svg').write_text(svg)
print('Clean vector contours generated for weapons and SCP-2176')
