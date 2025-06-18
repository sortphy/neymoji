import cv2
import mediapipe as mp
import random
import os
from emoji_matcher import compare_expression
from utils import get_random_emoji, draw_feedback

# Inicialização MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False,
                                   max_num_faces=1,
                                   refine_landmarks=True,
                                   min_detection_confidence=0.5,
                                   min_tracking_confidence=0.5)

# Emojis disponíveis
EMOJI_FOLDER = "emojis"
emoji_list = [f for f in os.listdir(EMOJI_FOLDER) if f.endswith(".png")]
current_emoji = get_random_emoji(emoji_list)
emoji_img = cv2.imread(os.path.join(EMOJI_FOLDER, current_emoji))

# Captura de vídeo
cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Erro na captura de vídeo")
        break

    # Espelhar imagem
    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    # Mostrar emoji no canto
    emoji_resized = cv2.resize(emoji_img, (100, 100))
    frame[10:110, 10:110] = emoji_resized

    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0]
        score, comment = compare_expression(landmarks, current_emoji)
        frame = draw_feedback(frame, score, comment)

    cv2.imshow('Imite o Emoji', frame)
    key = cv2.waitKey(5) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('n'):
        current_emoji = get_random_emoji(emoji_list)
        emoji_img = cv2.imread(os.path.join(EMOJI_FOLDER, current_emoji))

cap.release()
cv2.destroyAllWindows()
