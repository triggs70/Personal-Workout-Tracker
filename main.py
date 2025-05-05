import webview
import threading
from backend.app import app

def run_flask():
    app.run(debug=False, port=5000)

if __name__ == "__main__":
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()

    webview.create_window(
        "Workout Tracker",
        "http://127.0.0.1:5000", 
        width=1024,
        height=768,
        resizable=True
    )
