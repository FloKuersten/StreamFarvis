import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

# Target URL
url = "https://github.com/FloKuersten/StreamFarvis/releases/latest"

# Generate QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=2,
)
qr.add_data(url)
qr.make(fit=True)

# QR image (dark navy / charcoal pixels on white)
qr_img = qr.make_image(fill_color="#101116", back_color="#ffffff").convert("RGBA")
qr_w, qr_h = qr_img.size

# Card dimensions
card_w = 640
card_h = 820
card = Image.new("RGBA", (card_w, card_h), (16, 17, 22, 255))
draw = ImageDraw.Draw(card)

# Card border with subtle glow / rounded rect
draw.rounded_rectangle([4, 4, card_w - 5, card_h - 5], radius=24, outline="#2a2e42", width=2)
draw.rounded_rectangle([6, 6, card_w - 7, card_h - 7], radius=22, outline="#1b1e2c", width=1)

# Accent gradient / top bar
for i in range(6):
    draw.line([(30 + i * 2, 4 + i), (card_w - 30 - i * 2, 4 + i)], fill=(231, 76, 60, int(255 - i * 35)))

# Load fonts if possible, or fallback
try:
    font_title = ImageFont.truetype("arialbd.ttf", 30)
    font_sub = ImageFont.truetype("arial.ttf", 16)
    font_badge = ImageFont.truetype("arialbd.ttf", 13)
    font_footer = ImageFont.truetype("arial.ttf", 14)
except Exception:
    font_title = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_badge = ImageFont.load_default()
    font_footer = ImageFont.load_default()

# Try loading streamfarvis icon to put at top
icon_path = os.path.join("public", "streamfarvis-icon.png")
if os.path.exists(icon_path):
    try:
        icon = Image.open(icon_path).convert("RGBA")
        icon = icon.resize((64, 64), Image.Resampling.LANCZOS)
        card.paste(icon, (card_w // 2 - 32, 36), icon)
    except Exception as e:
        print("Icon error:", e)

# Header Text
title_text = "Scan to Download APK"
sub_text = "Point your phone camera here to get StreamFarvis"

# Measure and draw title
bbox_t = draw.textbbox((0, 0), title_text, font=font_title)
tw = bbox_t[2] - bbox_t[0]
draw.text(((card_w - tw) // 2, 116), title_text, fill="#ffffff", font=font_title)

# Measure and draw subtitle
bbox_s = draw.textbbox((0, 0), sub_text, font=font_sub)
sw = bbox_s[2] - bbox_s[0]
draw.text(((card_w - sw) // 2, 156), sub_text, fill="#9aa0b8", font=font_sub)

# QR container (white rounded card with slight shadow/border)
qr_container_w = qr_w + 32
qr_container_h = qr_h + 32
qc_x = (card_w - qr_container_w) // 2
qc_y = 196

draw.rounded_rectangle(
    [qc_x - 2, qc_y - 2, qc_x + qr_container_w + 2, qc_y + qr_container_h + 2],
    radius=20,
    outline="#3a4058",
    width=2
)
draw.rounded_rectangle(
    [qc_x, qc_y, qc_x + qr_container_w, qc_y + qr_container_h],
    radius=18,
    fill="#ffffff"
)

# Paste QR code into container
card.paste(qr_img, (qc_x + 16, qc_y + 16), qr_img)

# Optional small logo inside center of QR code
if os.path.exists(icon_path):
    try:
        center_logo_size = 56
        center_logo = Image.open(icon_path).convert("RGBA")
        center_logo = center_logo.resize((center_logo_size, center_logo_size), Image.Resampling.LANCZOS)
        
        # White backing circle for center logo
        cx = qc_x + qr_container_w // 2
        cy = qc_y + qr_container_h // 2
        pad = center_logo_size // 2 + 6
        draw.ellipse([cx - pad, cy - pad, cx + pad, cy + pad], fill="#ffffff", outline="#e74c3c", width=2)
        card.paste(center_logo, (cx - center_logo_size // 2, cy - center_logo_size // 2), center_logo)
    except Exception as e:
        print("Center logo error:", e)

# Bottom badge pills
badge_y = qc_y + qr_container_h + 28
pills = ["Android 7.0+", "ARM64 & x86_64", "v1.0.1 Signed APK"]
total_pills_w = 0
pill_widths = []
for p in pills:
    bb = draw.textbbox((0, 0), p, font=font_badge)
    pw = (bb[2] - bb[0]) + 24
    pill_widths.append(pw)
    total_pills_w += pw

gap = 10
start_px = (card_w - (total_pills_w + gap * (len(pills) - 1))) // 2
cur_x = start_px

for i, p in enumerate(pills):
    pw = pill_widths[i]
    draw.rounded_rectangle([cur_x, badge_y, cur_x + pw, badge_y + 28], radius=14, fill="#191c28", outline="#2b3149", width=1)
    bb = draw.textbbox((0, 0), p, font=font_badge)
    tx = cur_x + (pw - (bb[2] - bb[0])) // 2
    draw.text((tx, badge_y + 6), p, fill="#e2e8f0" if i != 2 else "#ff6b6b", font=font_badge)
    cur_x += pw + gap

# Footer text
footer_text = "github.com/FloKuersten/StreamFarvis/releases/latest"
bbox_f = draw.textbbox((0, 0), footer_text, font=font_footer)
fw = bbox_f[2] - bbox_f[0]
draw.text(((card_w - fw) // 2, badge_y + 44), footer_text, fill="#717a99", font=font_footer)

output_path = os.path.join("docs", "images", "qr-download.png")
card.save(output_path, "PNG")
print(f"Saved QR card to {output_path}")
