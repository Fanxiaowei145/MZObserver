"""Original monochrome HUD glyphs; existing human item silhouettes are reused separately."""
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1];out=r/'assets/killfeed';out.mkdir(exist_ok=True)
head='<circle cx="32" cy="8" r="5"/><path d="M27 15h10l4 12H23Z"/>'
skull='<path d="M23 18C12 4 26 0 32 1s20 6 9 17l-2 8H25Z"/><path d="M24 11h5m6 0h5M29 20v6m6-6v6" stroke="#111923" stroke-width="3"/>'
heart='<path d="M32 27 15 13C7-1 28-2 32 9 36-2 57-1 49 13Z"/>'
statue='<path d="M8 3Q14-1 20 2L25 10 22 20 24 30H6l3-10-4-8Z"/><path d="m10 7 4-2 1 6-5 1m8-5 4 2-2 5-3-2m-3 5 4 1-2 5-3-1Z" fill="#111923"/>'
glyphs={
 '173-snap': '<path d="M4 10h13l9 7-3 5-9-5H4Zm56 0H47l-9 7 3 5 9-5h10Z"/>'+head+'<path d="m29 15 7 4-7 5" fill="none" stroke="#111923" stroke-width="2.5"/>',
 '173-blink-snap':'<path d="M1 5h17M1 13h12M1 21h17" fill="none" stroke="currentColor" stroke-width="3"/>'+head+'<path d="m48 2 3 8 9 3-9 3-3 8-3-8-8-3 8-3Z"/>',
 '939-claw':'<path d="M19 1C11 9 10 19 17 30L25 2Zm13 0c-8 9-9 19-2 30L38 2Zm13 0c-8 9-9 19-2 30L51 2Z"/>',
 '939-pounce':'<path d="m8 18 8-9 14 1 8-5 12 4 5 8-10-3-5 4-10-2-6 5 9 8h-8l-9-9-9 6H2Zm38-15 8-2-4 5Z"/><path d="M7 5Q27-7 53 5" stroke="currentColor" fill="none" stroke-width="2"/>',
 '049-cardiac':heart+'<path d="M12 14h10l4-6 7 15 5-10 4 1h10" fill="none" stroke="#111923" stroke-width="3"/>',
 '049-touch':'<path d="M17 27 9 17c-3-4 2-7 5-3l4 4V6c0-4 5-4 5 0v7-10c0-4 5-4 5 0v10-8c0-4 5-4 5 0v10-6c0-4 5-4 5 0v12l-5 8H20Z"/><path d="m47 2 3 6 8 1-6 5 2 8-7-4-6 4 1-8-5-5 8-1Z"/>',
 '096-slash':'<path d="M2 19 15 17 26 5Q29 2 31 4T30 9L24 16 48 3Q51 1 52 4T50 8L32 18 56 8Q59 7 60 10T58 13L34 22 59 17Q62 17 62 20T59 23L35 26 51 25Q54 25 54 28T51 31H29Q22 31 16 27L2 29Z"/>',
 '096-charge':'<path d="m1 8 8 7-8 7m11-14 8 7-8 7" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="42" cy="6" r="5"/><path d="m31 12 12-2 9 7 10 1v5H49l-9-5-7 5 5 7h-8l-6-9Z"/>',
 '106-decay':'<path d="M29 1C24 9 15 15 15 21a14 10 0 0 0 28 0C43 15 34 9 29 1Z"/><circle cx="20" cy="21" r="2" fill="#111923"/><circle cx="32" cy="25" r="3" fill="#111923"/><path d="m45 6 4 4-4 4-4-4m9 8 3 3-3 3-3-3Z"/>',
 '106-pocket':'<ellipse cx="31" cy="17" rx="24" ry="10" fill="none" stroke="currentColor" stroke-width="3"/><path d="m11 23 7 5m34-5-7 5" fill="none" stroke="currentColor" stroke-width="2"/>'+ '<g transform="translate(12 3) scale(.6)">'+skull+'</g><path d="m29 1 3 4 3-4" fill="none" stroke="currentColor" stroke-width="2"/>',
 '106-execute':'<path d="M6 29V17l5-6 5 3-2 5 8 3h14l8-6 5 4-10 10H15Z"/><g transform="translate(15 -1) scale(.72)">'+skull+'</g>',
 '079-tesla':'<path d="M7 4v24m50-24v24M3 8h9M3 23h9M52 8h9m-9 15h9" stroke="currentColor" fill="none" stroke-width="3"/><path d="m35 0-17 18h12l-4 14 20-21H33Z"/>',
 '939-gas':'<path d="M17 25C1 25 2 11 14 11 10-2 33-4 35 8 47 0 59 10 53 18c11 9-2 14-11 8Z"/><circle cx="17" cy="18" r="2" fill="#111923"/><circle cx="29" cy="11" r="2" fill="#111923"/><circle cx="40" cy="20" r="3" fill="#111923"/>',
 '173-puddle':'<path d="M8 28q-7 2 1 3h47q11-2 1-4l-14 1-17-1Z"/><path d="M15 0h14v6l9 5 14 1q7 0 8 5H12V7l3-2Z"/><path d="m32 7-5 3m10-1-5 4m10-2-4 3" stroke="#111923" stroke-width="2"/><path d="M17 17c-3 4 2 7-5 12m18-12c-4 4 6 8-2 12m17-12c4 4-2 8 5 12m5-12c-1 5 5 7 2 12" fill="none" stroke="currentColor" stroke-width="2"/>',
 '096-concussion':'<path d="M25 29V19c-7-5-5-14 1-16 14-7 27 8 17 17v9Z"/><path d="m8 3 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1m50-5 1 4 4 1-4 2v4l-3-3-4 1 2-4-2-3 4 1Z"/><path d="M25 12h5m7 0h5" stroke="#111923" stroke-width="3"/>',
 '079-assist':'<rect x="12" y="2" width="40" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M27 24v5h11v-5M21 29h23" stroke="currentColor" stroke-width="2"/><circle cx="26" cy="11" r="3"/><circle cx="39" cy="16" r="3"/><path d="m28 12 8 3" stroke="currentColor" stroke-width="2"/>',
 'human-flash':'<path d="m32 0 4 10 10-7-5 11 13 2-12 5 6 9-12-5-4 7-4-9-12 6 6-10-13-3 13-4-4-10 10 7Z"/>',
 'human-burn':'<path d="M31 0c3 12-10 13-10 21 0 5 5 9 11 9 13 0 20-14 12-22-1 5-4 5-5 7 0-8-6-14-8-15Z"/><path d="M31 16c1 5-4 6-4 9 0 5 10 5 10-1 0-4-4-6-6-8Z" fill="#111923"/>',
 'suicide':skull,
}
# Character silhouettes remain legible at the small broadcast size. Shared attacks
# use the exact same asset in the kill and assist positions.
glyphs.update({
 '173-snap':statue+'<path d="m23 16 11-5 8 5-3 4-7-4-8 6Z"/><g transform="rotate(22 47 7)"><ellipse cx="47" cy="7" rx="5" ry="6"/></g><path d="m45 16 5 2 4 12H35l3-10Z"/><path d="m42 14 4 3-5 3 5 3" fill="none" stroke="#111923" stroke-width="2.6"/>',
 '173-blink-snap':'<g transform="translate(12 0)"><path d="M1 6h11M1 15h8M1 24h11" fill="none" stroke="currentColor" stroke-width="2.5"/><g transform="translate(12 0)">'+statue+'</g></g>',
 '939-pounce':'<path d="M3 25 12 16 16 9 20 5 25 7 30 5 34 8 41 10 45 5 55 6 63 13 51 12 59 20 49 17 44 13 39 17 31 18 40 24 52 27 49 31 36 28 28 21 20 19 11 28 3 28 8 24Z"/><path d="m18 8-1-6 7 5m1 0 2-6 5 7m-7 9-6 7 7 5h-7l-8-5 5-9Z"/><path d="m50 11 7 1-3 2m-5 0 5 3-5-1Z" fill="#111923"/>',
 '049-touch':'<path d="M6 30 10 19Q1 12 8 5 17-3 25 6l4 5 11 5-16 5-1 9Z"/><ellipse cx="16" cy="10" rx="4" ry="3" fill="#111923"/><path d="m24 15 11 1-11 2Z" fill="#111923"/><path d="M42 30 36 22q-3-4 1-5l5 4V9q0-4 3-3l1 12V4q0-3 3-2l1 15V6q1-3 3-1l1 14V11q1-3 3-1l1 12-4 8Z"/>',
 '096-slash':'<path d="M2 19 14 17 25 6 35 1 29 10 25 16 47 4 57 1 50 8 33 18 54 10 63 8 58 15 35 22 56 18 64 18 58 24 36 27 49 26 57 28 51 31H29Q22 31 16 27L2 29Z"/>',
 '096-charge':'<path d="M1 6h19M1 14h13M1 22h16" fill="none" stroke="currentColor" stroke-width="2.3"/><ellipse cx="40" cy="6" rx="4.5" ry="6"/><path d="M31 12 39 11 45 16 57 21l6 5-8-2-13-4-6-4-5 7 11 7h-9l-9-8 4-9-8 8-3-3Z"/><path d="m33 21-7 8-8 2-2-2 7-4 4-6Z"/><path d="m32 15 4 1m-5 2 4 1" stroke="#111923" stroke-width="1.4"/>',
 '106-pocket':'<ellipse cx="33" cy="24" rx="26" ry="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14 24q17-7 36 0M23 25q9-3 18 0" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="29" cy="5" r="4"/><path d="m27 11 8-2 6 6 12-5 2 3-14 7-8-6-2 7 9 4-4 3-11-5-3-9-8 2-7-8 3-2 6 6Z"/>',
 '106-execute':'<circle cx="44" cy="6" r="5"/><path d="M41 11h6v6l7 5 4 9H30l4-9 7-5Z"/><path d="M2 19 22 17 29 12 39 11 48 13Q51 14 49 16L42 15 36 17 45 18Q48 19 47 21H38l-6 3-8 1-22 3Z" stroke="#111923" stroke-width="1.8"/>',

})
# Read the actual character-card glyph, so the shapes cannot silently drift.
card_dizzy=re.search(r"const dizzy='([^']+)';",(r/'ui/app.js').read_text(encoding='utf-8'))[1]
glyphs['096-concussion']='<g transform="translate(12.3 0) scale(1.23)">'+re.sub(r'^<svg[^>]*>|</svg>$','',card_dizzy).replace('#f5cf48','currentColor')+'</g>'
for name,body in glyphs.items():
 (out/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" fill="currentColor" color="#fff" stroke-linejoin="round" stroke-linecap="round">'+body+'</svg>',encoding='utf-8')
print(json.dumps({'customGlyphs':len(glyphs),'directory':str(out)},ensure_ascii=False))
