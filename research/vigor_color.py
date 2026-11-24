import sys,json,struct
from pathlib import Path
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
e=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets')
objs={o.path_id:o for o in e.objects}
def examine_go(go,depth=0):
    if depth>5:return
    d=go.read();print(' '*depth,d.m_Name,go.path_id)
    for c in d.m_Component:
        o=c.component.deref();tree=o.read_typetree(check_read=False)
        if o.type.name=='MonoBehaviour':
            scr=o.read(check_read=False).m_Script.read()
            print(' '*depth,'SCRIPT',scr.m_ClassName,o.path_id)
            if scr.m_ClassName=='Image':
                raw=o.get_raw_data();print(' '*depth,'IMAGE_COLOR',struct.unpack_from('<4f',raw,44))
        if 'm_Color' in tree:print(' '*depth,'COLOR',json.dumps(tree['m_Color']))
        if 'm_Children' in tree:
            for child in tree['m_Children']:
                tr=objs.get(child['m_PathID'])
                if tr:
                    gid=tr.read_typetree()['m_GameObject']['m_PathID']
                    examine_go(objs[gid],depth+1)
for gid in ([int(x) for x in sys.argv[1:]] or [13378]):examine_go(objs[gid])
objs[988].read().image.save(Path('assets/official/Lightning.png'))
