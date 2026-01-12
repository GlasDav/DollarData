
import sys
import os

# Add current directory to path so we can import backend
current_dir = os.getcwd()
sys.path.append(current_dir)

print(f"Testing imports from {current_dir}...")

try:
    print("Attempting to import backend.models...")
    from backend import models
    print("✅ backend.models imported successfully")
except Exception as e:
    print(f"❌ Failed to import backend.models: {e}")
    sys.exit(1)

try:
    print("Attempting to import backend.routers.achievements...")
    from backend.routers import achievements
    print("✅ backend.routers.achievements imported successfully")
except Exception as e:
    print(f"❌ Failed to import backend.routers.achievements: {e}")
    # Print full traceback
    import traceback
    traceback.print_exc()
    sys.exit(1)
