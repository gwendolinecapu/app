import os
from PIL import Image, ImageDraw
import random

def generate_cartoon_grass(width, height):
    # Base color: Fresh green
    base_color = (124, 200, 100) # #7CC864
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)
    
    # Draw grass tufts
    tuft_color_light = (160, 230, 130)
    tuft_color_dark = (80, 160, 60)
    
    num_tufts = 400
    for _ in range(num_tufts):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(6, 12)
        
        # Determine color (mix of light and dark for depth)
        color = tuft_color_light if random.random() > 0.5 else tuft_color_dark
        
        # Draw a simple "V" or "W" shape for a tuft
        # Left blade
        draw.line([(x, y), (x - 2, y - size)], fill=color, width=2)
        # Right blade
        draw.line([(x, y), (x + 2, y - size)], fill=color, width=2)
        # Center blade (optional)
        if random.random() > 0.3:
            draw.line([(x, y), (x, y - size - 2)], fill=color, width=2)

    return img

def generate_cartoon_water(width, height):
    # Base color: Bright blue
    base_color = (144, 224, 239) # #90E0EF
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)
    
    wave_color = (255, 255, 255, 128) # Semi-transparent white
    
    num_waves = 200
    for _ in range(num_waves):
        x = random.randint(0, width)
        y = random.randint(0, height)
        length = random.randint(10, 25)
        
        # Draw small horizontal wave
        draw.arc([x, y, x + length, y + 5], 0, 180, fill=wave_color, width=2)

    return img

def generate_cartoon_dirt(width, height):
    # Base color: Earthy brown
    base_color = (212, 163, 115) # #D4A373
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)
    
    speck_color_1 = (180, 130, 90)
    speck_color_2 = (230, 190, 140)
    
    num_specks = 1000
    for _ in range(num_specks):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(1, 3)
        color = speck_color_1 if random.random() > 0.5 else speck_color_2
        draw.ellipse([x, y, x + size, y + size], fill=color)

    return img

def generate_cartoon_sand(width, height):
    # Base color: Sandy yellow
    base_color = (244, 208, 63) # #F4D03F
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)
    
    speck_color = (220, 180, 50)
    num_specks = 1500
    for _ in range(num_specks):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=speck_color)

    return img

def generate_cartoon_stone(width, height):
    # Base color: Grey
    base_color = (168, 168, 168) # #A8A8A8
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)
    
    # Draw rock shapes
    num_rocks = 50
    rock_color_outline = (100, 100, 100)
    rock_color_fill = (150, 150, 150)
    
    for _ in range(num_rocks):
        x = random.randint(0, width)
        y = random.randint(0, height)
        w = random.randint(10, 30)
        h = random.randint(10, 25)
        draw.ellipse([x, y, x + w, y + h], fill=rock_color_fill, outline=rock_color_outline, width=1)
        
    # Add noise specks
    for _ in range(500):
        x = random.randint(0, width)
        y = random.randint(0, height)
        draw.point((x, y), fill=(140, 140, 140))

    return img

def generate_cartoon_forest(width, height):
    # Base color: Dark Forest Green
    base_color = (34, 139, 34) # #228B22
    img = Image.new('RGB', (width, height), base_color)
    draw = ImageDraw.Draw(img)
    
    # Draw darker patches/leaves
    leaf_color = (0, 100, 0)
    
    num_leaves = 600
    for _ in range(num_leaves):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(3, 8)
        draw.ellipse([x, y, x + size, y + size], fill=leaf_color)

    return img

output_dir = 'assets/inner-world'
os.makedirs(output_dir, exist_ok=True)

textures = {
    'ground_grass.png': generate_cartoon_grass,
    'ground_dirt.png': generate_cartoon_dirt,
    'ground_sand.png': generate_cartoon_sand,
    'ground_stone.png': generate_cartoon_stone,
    'water_tile.png': generate_cartoon_water,
    'ground_forest.png': generate_cartoon_forest
}

for filename, generator in textures.items():
    path = os.path.join(output_dir, filename)
    print(f"Generating {path}...")
    img = generator(512, 512)
    img.save(path)
    print(f"Saved {path}")

print("All textures generated.")
