from pathlib import Path
p=Path('research/prepare_white_items.py');s=p.read_text();s=s.replace('th=math.radians(-angle);',"angle=-{'GunCOM15':10,'GunCOM18':15,'GunCom45':12,'GunCrossvec':15,'GunFSP9':20,'GunSCP127':5,'GunA7':15,'GunRevolver':25,'GunLogicer':38}.get(item,-angle)\n th=math.radians(-angle);");p.write_text(s)
# Make the installer safely repeatable.
p=Path('research/install_item_icons.py');s=p.read_text();a=s.index("p=Path('ui/index.html')");b=s.index("p=Path('ui/verify-render.cjs')");s=s[:a]+s[b:];a=s.index("p=Path('ui/layout-review.cjs')");s=s[:a];p.write_text(s)
