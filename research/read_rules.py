import html
import json
import pathlib
import re
import urllib.request

root = pathlib.Path(__file__).parent
source = (root / 'rules-page.html').read_text(encoding='utf-8')
url = re.search(r'href="(//docs.qq.com/dop-api/opendoc[^"]+)', source).group(1)
data = urllib.request.urlopen('https:' + html.unescape(url), timeout=20).read()
(root / 'rules-opendoc.txt').write_bytes(data)
text = data.decode('utf-8')
print('bytes:', len(data), 'prefix:', text[:250])
if text.startswith('clientVarsCallback('):
    text = text[len('clientVarsCallback('):].rstrip(';\n ')
    if text.endswith(')'):
        text = text[:-1]
try:
    obj = json.loads(text)
except ValueError:
    obj = None
strings = []
def walk(value, path=''):
    if isinstance(value, dict):
        for key, child in value.items():
            walk(child, path + '/' + key)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            walk(child, path + '/' + str(index))
    elif isinstance(value, str) and re.search('[\u4e00-\u9fff]', value):
        strings.append((path, value))
walk(obj)
(root / 'rules-strings.json').write_text(json.dumps(strings, ensure_ascii=False, indent=2), encoding='utf-8')
for path, value in strings:
    if len(value) > 60:
        print(path, value[:18000])
