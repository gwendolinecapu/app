from PIL import Image
import os

def remove_white_background(image_path, threshold=240):
    try:
        img = Image.open(image_path).convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            # Check if pixel is close to white
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                new_data.append((255, 255, 255, 0)) # Transparent
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(image_path, "PNG")
        print(f"Processed {image_path}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

# List of assets that need transparency
assets_to_fix = [
    'assets/inner-world/tree_green.png',
    'assets/inner-world/rock_large.png' # Likely also needs it
]

for asset in assets_to_fix:
    if os.path.exists(asset):
        remove_white_background(asset)
    else:
        print(f"File not found: {asset}")
