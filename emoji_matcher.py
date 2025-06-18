import math
import random

# Mapear emojis para "características"
# (isso é simplificado — você pode melhorar depois)
EMOJI_EXPRESSIONS = {
    "surprised.png": {"mouth_open": True, "eyebrows_raised": True},
    "angry.png": {"eyebrows_lowered": True, "mouth_open": False},
    "happy.png": {"smile": True},
    "neutral.png": {},
    "sad.png": {"mouth_curve_down": True},
}

COMMENTS = [
    (80, "Caramba! Ficou igualzinho! 😲"),
    (60, "Tá no caminho, só mais emoção aí! 😅"),
    (40, "Hmm... tá tentando né? 😐"),
    (20, "É uma interpretação... alternativa 🤔"),
    (0, "Bicho... você nem tentou né? 😂")
]

def compare_expression(landmarks, emoji_name):
    features = extract_features(landmarks)
    expected = EMOJI_EXPRESSIONS.get(emoji_name, {})

    score = 100

    if "mouth_open" in expected:
        if expected["mouth_open"] != features["mouth_open"]:
            score -= 40

    if "eyebrows_raised" in expected:
        if expected["eyebrows_raised"] != features["eyebrows_raised"]:
            score -= 30

    if "eyebrows_lowered" in expected:
        if expected["eyebrows_lowered"] != features["eyebrows_lowered"]:
            score -= 30

    if "smile" in expected:
        if expected["smile"] != features["smile"]:
            score -= 30

    if "mouth_curve_down" in expected:
        if expected["mouth_curve_down"] != features["mouth_curve_down"]:
            score -= 30

    for threshold, comment in COMMENTS:
        if score >= threshold:
            return score, comment

    return score, "Expressão desconhecida 😐"

def extract_features(landmarks):
    # Usa landmarks para detectar se boca está aberta, sobrancelha levantada, etc.
    # Índices simplificados com base no MediaPipe FaceMesh

    def dist(p1, p2):
        return math.hypot(p1.x - p2.x, p1.y - p2.y)

    # Boca
    top_lip = landmarks.landmark[13]
    bottom_lip = landmarks.landmark[14]
    mouth_open = dist(top_lip, bottom_lip) > 0.02

    # Sobrancelhas
    left_brow = landmarks.landmark[65]
    left_eye = landmarks.landmark[159]
    eyebrows_raised = (left_brow.y < left_eye.y - 0.015)
    eyebrows_lowered = (left_brow.y > left_eye.y)

    # Sorriso (distância entre canto da boca e centro da boca)
    left_mouth = landmarks.landmark[61]
    right_mouth = landmarks.landmark[291]
    center_mouth = landmarks.landmark[13]
    smile = (dist(left_mouth, center_mouth) > 0.04 and dist(right_mouth, center_mouth) > 0.04)

    mouth_curve_down = (left_mouth.y > center_mouth.y and right_mouth.y > center_mouth.y)

    return {
        "mouth_open": mouth_open,
        "eyebrows_raised": eyebrows_raised,
        "eyebrows_lowered": eyebrows_lowered,
        "smile": smile,
        "mouth_curve_down": mouth_curve_down
    }
