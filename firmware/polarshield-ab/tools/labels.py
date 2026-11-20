"""Knopteksten voor het touchscreen, per taal. Bron voor de tabel in lcd.ino.
Gebruik: python3 tools/labels.py  -> controleert de breedtes en schrijft de tabel in lcd.ino.
Een regel mag maximaal MAX_WIDTH pixels breed zijn; '\\n' begint een nieuwe regel."""
import re, sys
sys.path.insert(0, 'tools')
from make_graphics import ui_text_width  # noqa: E402

MAX_WIDTH = 84
LANGS = ['EN', 'NL']
LABELS = [
    ('BUTTON_SET_HOME', 0, 'Set\nhome', 'Home\nzetten'),
    ('BUTTON_POWER_ON', 0, 'Motors\non', 'Motoren\naan'),
    ('BUTTON_POWER_OFF', 0, 'Motors\noff', 'Motoren\nuit'),
    ('BUTTON_TOGGLE_ECHO', 0, 'Show\nmessages', 'Toon\nberichten'),
    ('BUTTON_ADJUST_PENLIFT', 0, 'Pen lift', 'Penlift'),
    ('BUTTON_DRAW_FROM_SD', 2, 'Draw\nfrom SD', 'Tekenen\nvan SD'),
    ('BUTTON_MORE_RIGHT', 4, 'More', 'Meer'),
    ('BUTTON_CALIBRATE', 4, 'Calibrate', 'Kalibreren'),
    ('BUTTON_PAUSE_RUNNING', 6, 'Pause', 'Pauze'),
    ('BUTTON_RESUME_RUNNING', 6, 'Resume', 'Doorgaan'),
    ('BUTTON_RESET', 4, 'Reset', 'Reset'),
    ('BUTTON_PEN_UP', 8, 'Pen\nup', 'Pen\nomhoog'),
    ('BUTTON_PEN_DOWN', 8, 'Pen\ndown', 'Pen\nomlaag'),
    ('BUTTON_PREV_FILE', 2, 'Previous\nfile', 'Vorig\nbestand'),
    ('BUTTON_NEXT_FILE', 8, 'Next\nfile', 'Volgend\nbestand'),
    ('BUTTON_CANCEL_FILE', 6, 'Back', 'Terug'),
    ('BUTTON_DRAW_THIS_FILE', 10, 'Draw\nthis file', 'Teken dit\nbestand'),
    ('BUTTON_STOP_FILE', 10, 'Stop\ndrawing', 'Stop\ntekenen'),
    ('BUTTON_SETTINGS_MENU', 10, 'Settings', 'Instellingen'),
    ('BUTTON_SETTINGS_MENU_2', 10, 'More\nsettings', 'Meer\ninstellingen'),
    ('BUTTON_DEC_SPEED', 2, 'Slower', 'Langzamer'),
    ('BUTTON_INC_SPEED', 8, 'Faster', 'Sneller'),
    ('BUTTON_DEC_ACCEL', 4, 'Accel.\nlower', 'Optrekken\nrustiger'),
    ('BUTTON_INC_ACCEL', 10, 'Accel.\nhigher', 'Optrekken\nsneller'),
    ('BUTTON_DEC_PENSIZE_INC', 2, 'Step\nsmaller', 'Stap\nkleiner'),
    ('BUTTON_INC_PENSIZE_INC', 8, 'Step\nlarger', 'Stap\ngroter'),
    ('BUTTON_DEC_PENSIZE', 4, 'Pen size\nsmaller', 'Pendikte\nkleiner'),
    ('BUTTON_INC_PENSIZE', 10, 'Pen size\nlarger', 'Pendikte\ngroter'),
    ('BUTTON_DONE', 6, 'Done', 'Klaar'),
    ('BUTTON_ADJUST_PENSIZE_MENU', 4, 'Pen size', 'Pendikte'),
    ('BUTTON_ADJUST_SPEED_MENU', 8, 'Speed', 'Snelheid'),
    ('BUTTON_ADJUST_POSITION_MENU', 2, 'Position', 'Positie'),
    ('BUTTON_MOVE_DEC_A', 2, 'Cord A\nshorter', 'Koord A\nkorter'),
    ('BUTTON_MOVE_INC_A', 8, 'Cord A\nlonger', 'Koord A\nlanger'),
    ('BUTTON_MOVE_DEC_B', 4, 'Cord B\nshorter', 'Koord B\nkorter'),
    ('BUTTON_MOVE_INC_B', 10, 'Cord B\nlonger', 'Koord B\nlanger'),
    ('BUTTON_DEC_PENLIFT_DOWN', 2, 'Pen down\n-', 'Omlaag\n-'),
    ('BUTTON_INC_PENLIFT_DOWN', 8, 'Pen down\n+', 'Omlaag\n+'),
    ('BUTTON_DEC_PENLIFT_UP', 4, 'Pen up\n-', 'Omhoog\n-'),
    ('BUTTON_INC_PENLIFT_UP', 10, 'Pen up\n+', 'Omhoog\n+'),
    ('BUTTON_PENLIFT_SAVE_TO_EEPROM', 0, 'Save', 'Opslaan'),
    ('BUTTON_LANGUAGE', 2, 'Language\nEnglish', 'Taal\nNederlands'),
    ('BUTTON_THEME', 4, 'Colours', 'Kleuren'),
]

errors = []
for bid, _, *texts in LABELS:
    for lang, t in zip(LANGS, texts):
        for line in t.split('\n'):
            w = ui_text_width(line)
            if w > MAX_WIDTH:
                errors.append(f'{bid} {lang}: "{line}" is {w} px (max {MAX_WIDTH})')
if errors:
    print('\n'.join(errors))
    sys.exit(1)

strs, rows = [], []
for i, (bid, ci, *texts) in enumerate(LABELS):
    for lang, t in zip(LANGS, texts):
        strs.append(f'const char LBL_{i}_{lang}[] PROGMEM = "{t.encode("unicode_escape").decode()}";')
    rows.append(f'  {{{bid}, {ci}, {{' + ', '.join(f'LBL_{i}_{lang}' for lang in LANGS) + '}},')
table = '// BEGIN KNOPTEKSTEN (gemaakt door tools/labels.py)\n' + '\n'.join(strs) + '\n// EIND KNOPTEKSTEN\n'
rowsblock = '// BEGIN KNOPTABEL (gemaakt door tools/labels.py)\n' + '\n'.join(rows) + '\n// EIND KNOPTABEL\n'

src = open('lcd.ino').read()
if '// BEGIN KNOPTEKSTEN' in src:
    src = re.sub(r'// BEGIN KNOPTEKSTEN.*?// EIND KNOPTEKSTEN\n', lambda m: table, src, flags=re.S)
    src = re.sub(r'// BEGIN KNOPTABEL.*?// EIND KNOPTABEL\n', lambda m: rowsblock, src, flags=re.S)
else:
    a = src.index('const char LBL_0_EN[]')
    b = src.index('struct ButtonLabel')
    src = src[:a] + table + '\n' + src[b:]
    a = src.index('const ButtonLabel BUTTON_LABELS[] PROGMEM = {\n') + len('const ButtonLabel BUTTON_LABELS[] PROGMEM = {\n')
    b = src.index('};', a)
    src = src[:a] + rowsblock + src[b:]
open('lcd.ino', 'w').write(src)
print(f'{len(LABELS)} knoppen, alle teksten passen.')
