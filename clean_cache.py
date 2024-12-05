import os
import shutil

def clean_python_cache(directory="."):
    try:
        # Find and remove .pyc files and __pycache__ directories
        for root, dirs, files in os.walk(directory):
            # Remove .pyc, .pyo, and .pyd files
            for file in files:
                if file.endswith(('.pyc', '.pyo', '.pyd')):
                    path = os.path.join(root, file)
                    os.remove(path)
                    print(f"Deleted: {path}")
            
            # Remove __pycache__ directories
            if '__pycache__' in dirs:
                path = os.path.join(root, '__pycache__')
                shutil.rmtree(path)
                print(f"Deleted: {path}")
        
        print("\nCache cleaning completed!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    clean_python_cache()
