import threading
import time
import webview
from backend.app import app

def run_flask():
    print("Starting Flask server...")
    app.run(debug=False, port=5000)

if __name__ == "__main__":
    print("Importing webview...")
    print("Importing Flask app...")
    print("Launching Flask thread...")
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    print("Waiting for Flask to start...")
    time.sleep(2)  
    print("Opening webview window...")
    window = webview.create_window(
        "Workout Tracker",
        "http://127.0.0.1:5000",
        width=1024,
        height=768,
        resizable=True
    )
    webview.start(gui="edgechromium", debug=True)