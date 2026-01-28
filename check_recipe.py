import sqlite3
import json
import sys

# Set UTF-8 encoding for output
sys.stdout.reconfigure(encoding="utf-8")

conn = sqlite3.connect("server/data.db")
cursor = conn.cursor()
cursor.execute("SELECT data FROM recipe LIMIT 1")
data = cursor.fetchone()[0]
recipe = json.loads(data)

print("Recipe structure:")
print("Title:", recipe.get("title"))
print("Quantity:", recipe.get("quantity"))
print("Total time:", recipe.get("totalTime"))
print("Categories:", recipe.get("categories"))
print("\nIngredients:")
ingredients = recipe.get("ingredients", [])
print("Type:", type(ingredients))
print("Count:", len(ingredients))
if isinstance(ingredients, str):
    print("String content (first 200 chars):", ingredients[:200])
elif ingredients and len(ingredients) > 0:
    print("First 3 items:")
    for i, ing in enumerate(ingredients[:3]):
        print(f"  {i+1}. {ing}")

conn.close()
