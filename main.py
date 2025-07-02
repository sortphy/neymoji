import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import json
import random
from collections import defaultdict
import time

app = Flask(__name__)
CORS(app)

# Game state
game_state = {
    'current_emoji': '',
    'current_round': 1,
    'score': 0,
    'total_rounds': 10,
    'round_start_time': time.time(),
    'round_duration': 30,  # seconds
    'freeze_frames': [],
    'game_active': False
}

# Emoji mappings with detection criteria
EMOJI_CHALLENGES = [
    {'emoji': '😊', 'name': 'Happy', 'detect_func': 'detect_smile'},
    {'emoji': '😮', 'name': 'Surprised', 'detect_func': 'detect_surprise'},
    {'emoji': '😴', 'name': 'Sleepy', 'detect_func': 'detect_eyes_closed'},
    {'emoji': '😗', 'name': 'Kiss', 'detect_func': 'detect_kiss'},
    {'emoji': '😉', 'name': 'Wink', 'detect_func': 'detect_wink'},
    {'emoji': '🙄', 'name': 'Eye Roll', 'detect_func': 'detect_look_up'},
    {'emoji': '😯', 'name': 'Open Mouth', 'detect_func': 'detect_open_mouth'},
]

# Load face cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')

def detect_smile(frame, face):
    x, y, w, h = face
    roi_gray = cv2.cvtColor(frame[y:y+h, x:x+w], cv2.COLOR_BGR2GRAY)
    smiles = smile_cascade.detectMultiScale(roi_gray, 1.8, 20)
    return len(smiles) > 0

def detect_surprise(frame, face):
    # Simple approximation: detect wide eyes (more than 2 eyes detected)
    x, y, w, h = face
    roi_gray = cv2.cvtColor(frame[y:y+h//2, x:x+w], cv2.COLOR_BGR2GRAY)
    eyes = eye_cascade.detectMultiScale(roi_gray)
    return len(eyes) >= 2

def detect_eyes_closed(frame, face):
    # Detect if no eyes are visible
    x, y, w, h = face
    roi_gray = cv2.cvtColor(frame[y:y+h//2, x:x+w], cv2.COLOR_BGR2GRAY)
    eyes = eye_cascade.detectMultiScale(roi_gray)
    return len(eyes) == 0

def detect_kiss(frame, face):
    # Approximation: check mouth area for specific patterns
    x, y, w, h = face
    mouth_roi = frame[y+h//2:y+h, x+w//4:x+3*w//4]
    return detect_circular_mouth(mouth_roi)

def detect_wink(frame, face):
    # Detect only one eye
    x, y, w, h = face
    roi_gray = cv2.cvtColor(frame[y:y+h//2, x:x+w], cv2.COLOR_BGR2GRAY)
    eyes = eye_cascade.detectMultiScale(roi_gray)
    return len(eyes) == 1

def detect_look_up(frame, face):
    # Simple approximation based on eye position
    x, y, w, h = face
    upper_roi = cv2.cvtColor(frame[y:y+h//3, x:x+w], cv2.COLOR_BGR2GRAY)
    eyes = eye_cascade.detectMultiScale(upper_roi)
    return len(eyes) >= 1

def detect_open_mouth(frame, face):
    # Detect mouth opening using contour analysis
    x, y, w, h = face
    mouth_roi = frame[y+2*h//3:y+h, x+w//4:x+3*w//4]
    return detect_mouth_opening(mouth_roi)

def detect_circular_mouth(roi):
    # Simple circular pattern detection for kiss
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20, param1=50, param2=30, minRadius=5, maxRadius=25)
    return circles is not None

def detect_mouth_opening(roi):
    # Detect mouth opening using edge detection
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > 100:  # Adjust threshold as needed
            return True
    return False

def start_new_round():
    if game_state['current_round'] <= game_state['total_rounds']:
        challenge = random.choice(EMOJI_CHALLENGES)
        game_state['current_emoji'] = challenge
        game_state['round_start_time'] = time.time()
        return True
    return False

def check_expression(frame_data):
    # Decode base64 image
    img_data = base64.b64decode(frame_data.split(',')[1])
    nparr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Detect faces
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        return False, None
    
    # Get the largest face
    face = max(faces, key=lambda x: x[2] * x[3])
    
    # Check if current expression matches target
    current_challenge = game_state['current_emoji']
    if not current_challenge:
        return False, None
    
    detect_func_name = current_challenge['detect_func']
    detect_func = globals()[detect_func_name]
    
    if detect_func(frame, face):
        # Capture freeze frame
        x, y, w, h = face
        face_img = frame[y:y+h, x:x+w]
        _, buffer = cv2.imencode('.jpg', face_img)
        freeze_frame = base64.b64encode(buffer).decode('utf-8')
        
        return True, freeze_frame
    
    return False, None

@app.route('/start_game', methods=['POST'])
def start_game():
    game_state['current_round'] = 1
    game_state['score'] = 0
    game_state['freeze_frames'] = []
    game_state['game_active'] = True
    
    if start_new_round():
        return jsonify({
            'success': True,
            'game_state': {
                'current_emoji': game_state['current_emoji'],
                'current_round': game_state['current_round'],
                'score': game_state['score'],
                'total_rounds': game_state['total_rounds'],
                'time_left': game_state['round_duration']
            }
        })
    return jsonify({'success': False, 'message': 'Failed to start game'})

@app.route('/check_frame', methods=['POST'])
def check_frame():
    if not game_state['game_active']:
        return jsonify({'success': False, 'message': 'Game not active'})
    
    data = request.json
    frame_data = data.get('frame')
    
    # Check if round time expired
    elapsed_time = time.time() - game_state['round_start_time']
    if elapsed_time > game_state['round_duration']:
        # Move to next round without scoring
        game_state['current_round'] += 1
        if game_state['current_round'] > game_state['total_rounds']:
            game_state['game_active'] = False
            return jsonify({
                'success': True,
                'game_over': True,
                'final_score': game_state['score'],
                'freeze_frames': game_state['freeze_frames']
            })
        
        start_new_round()
        return jsonify({
            'success': True,
            'round_timeout': True,
            'game_state': {
                'current_emoji': game_state['current_emoji'],
                'current_round': game_state['current_round'],
                'score': game_state['score'],
                'total_rounds': game_state['total_rounds'],
                'time_left': game_state['round_duration']
            }
        })
    
    # Check expression
    expression_matched, freeze_frame = check_expression(frame_data)
    
    if expression_matched:
        game_state['score'] += 100
        if freeze_frame:
            game_state['freeze_frames'].append({
                'round': game_state['current_round'],
                'emoji': game_state['current_emoji'],
                'image': freeze_frame
            })
        
        # Move to next round
        game_state['current_round'] += 1
        
        if game_state['current_round'] > game_state['total_rounds']:
            game_state['game_active'] = False
            return jsonify({
                'success': True,
                'expression_matched': True,
                'game_over': True,
                'final_score': game_state['score'],
                'freeze_frames': game_state['freeze_frames']
            })
        
        start_new_round()
        
        return jsonify({
            'success': True,
            'expression_matched': True,
            'points_earned': 100,
            'freeze_frame': freeze_frame,
            'game_state': {
                'current_emoji': game_state['current_emoji'],
                'current_round': game_state['current_round'],
                'score': game_state['score'],
                'total_rounds': game_state['total_rounds'],
                'time_left': game_state['round_duration']
            }
        })
    
    return jsonify({
        'success': True,
        'expression_matched': False,
        'game_state': {
            'current_emoji': game_state['current_emoji'],
            'current_round': game_state['current_round'],
            'score': game_state['score'],
            'total_rounds': game_state['total_rounds'],
            'time_left': max(0, game_state['round_duration'] - elapsed_time)
        }
    })

@app.route('/game_state', methods=['GET'])
def get_game_state():
    return jsonify({
        'game_active': game_state['game_active'],
        'current_emoji': game_state['current_emoji'],
        'current_round': game_state['current_round'],
        'score': game_state['score'],
        'total_rounds': game_state['total_rounds'],
        'freeze_frames': game_state['freeze_frames']
    })

# Add a simple home route to avoid 404 errors
@app.route('/')
def home():
    return jsonify({
        'message': 'Emoji Guessing Game Backend is running!',
        'endpoints': {
            'start_game': 'POST /start_game',
            'check_frame': 'POST /check_frame', 
            'game_state': 'GET /game_state'
        }
    })

if __name__ == '__main__':
    print("🎮 Starting Emoji Guessing Game Backend...")
    print("📡 Server running on http://localhost:5000")
    print("🔗 Available endpoints:")
    print("   - POST /start_game - Start a new game")
    print("   - POST /check_frame - Send webcam frame for analysis")
    print("   - GET /game_state - Get current game state")
    print("✅ Backend ready! Now start your React frontend.")
    app.run(debug=True, host='0.0.0.0', port=5000)