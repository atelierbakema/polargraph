"""Maakt ab_graphics.c: het knoplettertype en het logo voor het touchscreen.

- AbButtonFont: 8x16 pixels per teken (ASCII 32-126) in het UTFT-formaat,
  getekend uit JetBrains Mono Bold (SIL Open Font License).
- AbLogo: "Atelier Bakema" als 1-bits plaatje, uit Inter Display SemiBold (SIL OFL).
- AbUi*: het lettertype voor knoppen en tekst: Inter SemiBold 14 px, proportioneel,
  met zachte randen (2 bits per pixel = 4 grijstinten, gemengd met de achtergrondkleur).

Gebruik: python3 tools/make_graphics.py   (vanuit de firmwaremap; vereist Pillow)
"""
from PIL import Image, ImageDraw, ImageFont

MONO = '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf'
DISPLAY = '/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf'
UI = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
UI_SIZE = 14
UI_HEIGHT = 17


def font_8x16():
    w, h = 8, 16
    font = ImageFont.truetype(MONO, 13)
    out = [w, h, 32, 95]
    for code in range(32, 127):
        img = Image.new('1', (w, h), 0)
        d = ImageDraw.Draw(img)
        bbox = font.getbbox('M')  # vaste basislijn voor alle tekens
        d.text((0, (h - (bbox[3] - bbox[1])) // 2 - bbox[1]), chr(code), font=font, fill=1)
        for y in range(h):
            byte = 0
            for x in range(w):
                if img.getpixel((x, y)):
                    byte |= 0x80 >> x
            out.append(byte)
    return out


def logo(text, size):
    font = ImageFont.truetype(DISPLAY, size)
    l, t, r, b = font.getbbox(text)
    w, h = r - l + 2, b - t + 2
    w = (w + 7) // 8 * 8
    img = Image.new('L', (w, h), 0)
    ImageDraw.Draw(img).text((1 - l, 1 - t), text, font=font, fill=255)
    img = img.point(lambda v: 1 if v >= 110 else 0, '1')
    data = []
    for y in range(h):
        for xb in range(0, w, 8):
            byte = 0
            for x in range(8):
                if img.getpixel((xb + x, y)):
                    byte |= 0x80 >> x
            data.append(byte)
    return w, h, data


def ui_font():
    font = ImageFont.truetype(UI, UI_SIZE)
    ascent, descent = font.getmetrics()
    top = (UI_HEIGHT - (ascent + descent)) // 2
    widths, offsets, data = [], [], []
    for code in range(32, 127):
        ch = chr(code)
        w = max(1, round(font.getlength(ch)))
        img = Image.new('L', (w + 2, UI_HEIGHT), 0)
        ImageDraw.Draw(img).text((0, top), ch, font=font, fill=255)
        img = img.crop((0, 0, w, UI_HEIGHT))
        bits = []
        for y in range(UI_HEIGHT):
            for x in range(w):
                bits.append(min(3, round(img.getpixel((x, y)) / 255 * 3)))
        while len(bits) % 4:
            bits.append(0)
        offsets.append(len(data))
        widths.append(w)
        for i in range(0, len(bits), 4):
            data.append(bits[i] << 6 | bits[i + 1] << 4 | bits[i + 2] << 2 | bits[i + 3])
    return widths, offsets, data


def ui_text_width(text):
    font = ImageFont.truetype(UI, UI_SIZE)
    return sum(max(1, round(font.getlength(c))) for c in text)


def c_array(name, data, per_line=16):
    lines = []
    for i in range(0, len(data), per_line):
        lines.append('  ' + ','.join(f'0x{v:02X}' for v in data[i:i + per_line]) + ',')
    return f'const uint8_t {name}[] PROGMEM = {{\n' + '\n'.join(lines) + '\n};\n'


if __name__ == '__main__':
    font = font_8x16()
    lw, lh, logo_data = logo('Atelier Bakema', 34)
    with open('ab_graphics.c', 'w') as f:
        f.write('// Gemaakt door tools/make_graphics.py. Niet met de hand aanpassen.\n')
        f.write('// Lettertypes: JetBrains Mono en Inter, beide SIL Open Font License 1.1.\n')
        f.write('#include <stdint.h>\n#if defined(__AVR__)\n#include <avr/pgmspace.h>\n#else\n#define PROGMEM\n#endif\n\n')
        # extern "C" + eerst declareren: zo blijven de namen gelijk, ook als het als C++ wordt gecompileerd.
        f.write('#ifdef __cplusplus\nextern "C" {\n#endif\n')
        f.write('extern const uint8_t AbButtonFont[];\nextern const uint8_t AbLogo[];\n')
        f.write('extern const uint16_t AbLogoWidth;\nextern const uint16_t AbLogoHeight;\n')
        f.write('extern const uint8_t AbUiHeight;\nextern const uint8_t AbUiWidths[];\nextern const uint16_t AbUiOffsets[];\nextern const uint8_t AbUiData[];\n\n')
        f.write(c_array('AbButtonFont', font))
        f.write(f'\nconst uint16_t AbLogoWidth = {lw};\nconst uint16_t AbLogoHeight = {lh};\n')
        f.write(c_array('AbLogo', logo_data))
        uw, uo, ud = ui_font()
        f.write(f'\nconst uint8_t AbUiHeight = {UI_HEIGHT};\n')
        f.write(c_array('AbUiWidths', uw))
        f.write('const uint16_t AbUiOffsets[] PROGMEM = {\n  ' + ','.join(str(v) for v in uo) + '\n};\n')
        f.write(c_array('AbUiData', ud))
        f.write('#ifdef __cplusplus\n}\n#endif\n')
    print(f'lettertype: {len(font)} bytes, logo: {lw}x{lh} ({len(logo_data)} bytes), ui: {len(ui_font()[2])} bytes')
