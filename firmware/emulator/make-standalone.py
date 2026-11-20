"""Maakt één losse HTML-pagina van de emulator (firmware ingebakken), om online te zetten.
Gebruik: python3 make-standalone.py uitvoer.html [--fragment]
Met --fragment zonder <html>/<head>/<body>, voor pagina's die zelf een omhulsel geven."""
import re
import sys

html = open('index.html', encoding='utf-8').read()
js = open('dist/firmware.js', encoding='utf-8').read().replace('�', '\\uFFFD')
assert '</script' not in js.lower()
html = html.replace('<script src="dist/firmware.js"></script>', '<script>\n' + js + '\n</script>')
if '--fragment' in sys.argv:
    title = re.search(r'<title>.*?</title>', html).group(0)
    style = re.search(r'<style>.*?</style>', html, re.S).group(0)
    body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    html = f'{title}\n{style}\n{body}'
open(sys.argv[1], 'w', encoding='utf-8').write(html)
print(f'{sys.argv[1]}: {len(html) // 1024} kB')
