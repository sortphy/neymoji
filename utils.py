import cv2

def get_random_emoji(emoji_list):
    return random.choice(emoji_list)

def draw_feedback(frame, score, comment):
    height, width, _ = frame.shape
    text = f"Nota: {score}/100"

    cv2.rectangle(frame, (10, height - 70), (width - 10, height - 10), (0, 0, 0), -1)
    cv2.putText(frame, text, (20, height - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, comment, (20, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    return frame