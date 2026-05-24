let conversationHistory = [];
let isLoading = false;

marked.setOptions({ breaks: true });

const WELCOME_TEXT =
    `Hola, soy **Agnes** ✦\n\nSoy tu guía en el mundo del arte feminista y queer. ` +
    `Hoy celebramos a **${ARTIST_NAME}** — puedes preguntarme sobre su obra, o explorar ` +
    `cualquier tema que te interese: artistas, movimientos, recomendaciones, historia...\n\n` +
    `*¿Qué quieres descubrir hoy?*`;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("welcome-msg").innerHTML = marked.parse(WELCOME_TEXT);
    conversationHistory.push({ role: "assistant", content: WELCOME_TEXT });
    document.getElementById("input").focus();
});

function askAboutArtist(name) {
    const input = document.getElementById("input");
    input.value = `Cuéntame más sobre ${name} y su importancia en el arte feminista y queer`;
    autoResize(input);
    sendMessage();
}

function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function scrollToBottom() {
    const el = document.getElementById("messages");
    el.scrollTop = el.scrollHeight;
}

function addMessage(role, html) {
    const container = document.getElementById("messages");
    const wrapper = document.createElement("div");
    wrapper.className = `message ${role}`;
    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = html;
    wrapper.appendChild(content);
    container.appendChild(wrapper);
    scrollToBottom();
    return content;
}

async function sendMessage() {
    if (isLoading) return;

    const input = document.getElementById("input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.style.height = "auto";

    addMessage("user", escapeHtml(text));
    conversationHistory.push({ role: "user", content: text });

    isLoading = true;
    document.getElementById("send-btn").disabled = true;

    const contentEl = addMessage("assistant", '<span class="cursor">▌</span>');
    let fullText = "";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: conversationHistory }),
        });

        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const raw = line.slice(6).trim();
                if (raw === "[DONE]") break;

                try {
                    const parsed = JSON.parse(raw);
                    if (parsed.error) {
                        fullText = "Hubo un error al procesar tu consulta. Por favor, inténtalo de nuevo.";
                        break;
                    }
                    if (parsed.text) {
                        fullText += parsed.text;
                        contentEl.innerHTML =
                            marked.parse(fullText) + '<span class="cursor">▌</span>';
                        scrollToBottom();
                    }
                } catch {
                    // skip malformed SSE chunks
                }
            }
        }

        contentEl.innerHTML = marked.parse(fullText || "Lo siento, no pude procesar tu mensaje.");
        conversationHistory.push({ role: "assistant", content: fullText });

    } catch (err) {
        contentEl.innerHTML = marked.parse(
            "Lo siento, hubo un error de conexión. Por favor, inténtalo de nuevo."
        );
    }

    isLoading = false;
    document.getElementById("send-btn").disabled = false;
    document.getElementById("input").focus();
    scrollToBottom();
}

function resetChat() {
    conversationHistory = [];
    const container = document.getElementById("messages");
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "message assistant";
    const content = document.createElement("div");
    content.className = "message-content";
    content.id = "welcome-msg";
    content.innerHTML = marked.parse(WELCOME_TEXT);
    wrapper.appendChild(content);
    container.appendChild(wrapper);

    conversationHistory.push({ role: "assistant", content: WELCOME_TEXT });
    document.getElementById("input").focus();
}
