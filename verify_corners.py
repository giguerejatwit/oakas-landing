"""Verify new corners"""
from PIL import Image, ImageDraw

img = Image.open('/Users/indoorgeo/.openclaw/workspace/landing/original_5.0.jpg').convert('RGB')
draw = ImageDraw.Draw(img)

# New corrected corners
corners = [(270, 340), (510, 290), (205, 660), (520, 620)]
labels = ['TL', 'TR', 'BL', 'BR']

for (x, y), label in zip(corners, labels):
    draw.ellipse([x-6, y-6, x+6, y+6], fill='lime', outline='lime')
    draw.text((x+10, y-5), f"{label}({x},{y})", fill='lime')

# Connect: TL->TR->BR->BL->TL
draw.line([corners[0], corners[1]], fill='lime', width=2)
draw.line([corners[1], corners[3]], fill='lime', width=2)
draw.line([corners[3], corners[2]], fill='lime', width=2)
draw.line([corners[2], corners[0]], fill='lime', width=2)

img.save('/Users/indoorgeo/.openclaw/workspace/landing/verify_corners.jpg')
print("Done")
