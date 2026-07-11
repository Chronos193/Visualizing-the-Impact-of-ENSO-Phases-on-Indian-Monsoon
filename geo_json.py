import geopandas as gpd
import matplotlib.pyplot as plt

# 1. Load the file directly into a structured GeoDataFrame
file_path = r"E:\CS661_Data\india_states.geojson"
gdf = gpd.read_file(file_path)

# 2. Inspect the tabular attribute columns (like state names)
print("--- Dataset Structure ---")
print(gdf.head())

print("\n--- Available States/Regions ---")
# Adjust 'shapeName' if your geojson uses a slightly different property key
if 'shapeName' in gdf.columns:
    print(gdf['shapeName'].sort_values().to_string())
else:
    print(gdf.columns)

# 3. Graphically render the geographic boundaries
fig, ax = plt.subplots(figsize=(10, 10))
gdf.plot(ax=ax, edgecolor='black', color='lightblue')

# Add clean titles and remove the raw spatial coordinate axis lines
plt.title("India First-Level Administrative Boundaries (ADM1)", fontsize=14)
ax.axis('off')

# Display the map window
plt.show()