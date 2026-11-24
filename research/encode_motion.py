from PIL import Image
from pathlib import Path
out=Path('output')
for source,name in [('floor','floor-transition'),('health','health-ticks')]:
    files=sorted((out/'motion-frames').glob(source+'-*.png'))
    frames=[]
    for f in files:
        with Image.open(f) as im:frames.append(im.convert('RGB').quantize(colors=256))
    frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=50,loop=0,disposal=2,optimize=False)
    print(name,len(frames),'frames', (out/(name+'.gif')).stat().st_size)
