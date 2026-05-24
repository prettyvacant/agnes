import os
import json
import hashlib
import datetime
from flask import Flask, render_template, request, Response, jsonify
from flask_cors import CORS
from anthropic import Anthropic
from artists import ARTISTS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
client = Anthropic()


def get_artist_of_the_day():
    today = datetime.date.today().isoformat()
    idx = int(hashlib.md5(today.encode()).hexdigest(), 16) % len(ARTISTS)
    return ARTISTS[idx]


def build_system_prompt(artist):
    obras = ", ".join(artist["obras_destacadas"])
    temas = ", ".join(artist["temas"])
    movimientos = ", ".join(artist["movimientos"])
    return f"""Eres Agnes, una guía apasionada y experta en arte feminista y queer. Tu misión es compartir, recomendar y celebrar el arte creado por mujeres, personas no binarias y la comunidad LGBTQ+ en toda su diversidad.

Tienes conocimiento profundo de la historia del arte desde perspectivas feministas e interseccionales. Conoces artistas de todo el mundo y todas las épocas, movimientos como el Feminismo del Arte, Arte Queer, Arte Chicano, Performance Feminista, Arte Lésbico, y el contexto histórico-político de estas obras.

**✦ ARTISTA DEL DÍA: {artist["name"]} ({artist["years"]})**
{artist["nacionalidad"]} | {movimientos}
{artist["descripcion"]}
Obras destacadas: {obras}
Temas: {temas}

Cuando recomiendas arte:
- Menciona artistas y obras concretas, con fechas cuando sea posible
- Das contexto histórico, político y social
- Conectas el arte con luchas feministas y queer específicas
- Celebras la diversidad: raza, clase, origen, género, sexualidad
- Eres cálida, apasionada, accesible y educativa
- Puedes recomendar dónde ver el trabajo (museos, libros, documentales)
- Si no sabes algo, lo dices con honestidad

Responde siempre en el idioma del usuario. Usa formato markdown cuando sea útil."""


@app.route("/")
def index():
    artist = get_artist_of_the_day()
    return render_template("index.html", artist=artist)


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    messages = data.get("messages", [])

    artist = get_artist_of_the_day()
    system_prompt = build_system_prompt(artist)

    def generate():
        try:
            with client.messages.stream(
                model=os.getenv("CLAUDE_MODEL", "claude-opus-4-7"),
                max_tokens=1500,
                system=[
                    {
                        "type": "text",
                        "text": system_prompt,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=messages[-20:],
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/api/artist", methods=["GET"])
def artist_of_day():
    return jsonify(get_artist_of_the_day())


@app.route("/api/chat/simple", methods=["POST"])
def chat_simple():
    data = request.get_json()
    messages = data.get("messages", [])

    artist = get_artist_of_the_day()
    system_prompt = build_system_prompt(artist)

    response = client.messages.create(
        model=os.getenv("CLAUDE_MODEL", "claude-opus-4-7"),
        max_tokens=1500,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=messages[-20:],
    )

    return jsonify({"response": response.content[0].text})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
