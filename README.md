# 😜 Imite o Emoji – Jogo de Visão Computacional com Python

Um jogo divertido que testa suas habilidades de atuação imitando emojis usando **visão computacional**!  
A cada rodada, um emoji aparece e você precisa **fazer a mesma cara**.  
O sistema compara sua expressão com o emoji e dá uma **nota + comentário engraçado**.  
Feito com 💖 usando OpenCV + MediaPipe.

---

## 🖥️ Demonstração

![demo gif](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzV4Nmc2emoybGZ5eHRjbWs2eHg3aDZtZ2h2YzU2enJ1ZnF3dHFnbiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/W5uYhCG1FzKrK/giphy.gif)

---

## 🚀 Como Rodar Localmente

### 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/imite-o-emoji.git
cd imite-o-emoji
```

### 2. Instale as dependências

Recomendo usar um ambiente virtual (opcional):

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate   # Windows
```

Agora instale os pacotes:

```bash
pip install opencv-python mediapipe
```

### 3. Adicione os emojis

Na pasta `emojis/`, adicione alguns arquivos `.png` com nomes como:

- `happy.png`
- `angry.png`
- `sad.png`
- `surprised.png`
- `neutral.png`

Você pode baixar emojis transparentes de sites como [emojipedia.org](https://emojipedia.org/) ou usar os seus preferidos.

---

## 🕹️ Como Jogar

```bash
python main.py
```

- A câmera vai abrir.
- Um emoji aparece no canto da tela.
- Imite a expressão!
- Receba uma nota de 0 a 100 e um comentário divertido.
- Pressione `n` para trocar de emoji.
- Pressione `q` para sair.

---

## 🛠️ Feito com

- 🧠 [MediaPipe](https://mediapipe.dev) – detecção de pontos faciais
- 🎥 [OpenCV](https://opencv.org/) – captura da webcam e interface gráfica
- 🐍 Python – porque é fofo também 💕

---

## 📄 Licença

MIT – use, modifique e divirta-se!

---

## 😄 Créditos

Feito por [Seu Nome] como projeto divertido de faculdade ✨  
Ideia desenvolvida com ajuda do ChatGPT 🤖💬
