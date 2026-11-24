import sys,struct,json
sys.path.insert(0,r'C:\Users\86188\Documents\电脑调试\SLUI-Minimap\research\unity-vendor')
import UnityPy
e=UnityPy.load(r'D:\steam\steamapps\common\SCP Secret Laboratory\SCPSL_Data\resources.assets'); d={o.path_id:o for o in e.objects}
for i in [67436,69286,71382,70038,63788]:
 o=d[i]; x=o.read(check_read=False); print(i,x.m_Script.read().m_ClassName,o.get_raw_data().hex())
