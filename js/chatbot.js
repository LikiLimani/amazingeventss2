/* =========================================================
   AmazingEventss — chatbot.js
   Talks to the separate eventbot-backend Express API
   (see the eventbot-backend project — this is NOT part of
   this static site's deploy, it calls out to wherever you
   hosted that backend, e.g. Render/Railway).
   ========================================================= */

/**
 * EDIT THIS after you deploy eventbot-backend (Render, Railway, etc).
 * Example: "https://eventbot-backend.onrender.com"
 * Leave the trailing slash off.
 */
const CHAT_API_BASE_URL = "https://eventbot-backend-l0ku.onrender.com";

const CHAT_HISTORY_KEY = "ae_chat_history";
const CHAT_OPEN_KEY = "ae_chat_open";
const MAX_STORED_MESSAGES = 20;

document.addEventListener("DOMContentLoaded", function () {
  var widget = document.getElementById("chatWidget");
  if (!widget) return; // widget markup not present on this page

  var toggleBtn = document.getElementById("chatToggle");
  var closeBtn = document.getElementById("chatClose");
  var panel = document.getElementById("chatPanel");
  var messagesEl = document.getElementById("chatMessages");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var sendBtn = form ? form.querySelector(".chat-send") : null;

  /* ---------- Persistence across page navigation (same tab/session only) ---------- */
  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(CHAT_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history.slice(-MAX_STORED_MESSAGES)));
    } catch (e) {
      /* sessionStorage unavailable (private browsing etc) — fail silently, chat still works for this page view */
    }
  }

  var history = loadHistory();

  /* ---------- Rendering ---------- */
  function renderMessage(role, text) {
    var el = document.createElement("div");
    el.className =
      "chat-msg " +
      (role === "user" ? "chat-msg-user" : role === "error" ? "chat-msg-error" : "chat-msg-bot");
    el.textContent = text; // textContent (not innerHTML) — never render raw HTML from either side
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderAllFromHistory() {
    messagesEl.innerHTML = "";
    if (history.length === 0) {
      renderMessage(
        "assistant",
        "Hi! I can answer questions about our cold spark, fog, lighting, and confetti services. What would you like to know?"
      );
    } else {
      history.forEach(function (m) {
        renderMessage(m.role, m.content);
      });
    }
  }

  function showTyping() {
    var el = document.createElement("div");
    el.className = "chat-typing";
    el.id = "chatTypingIndicator";
    el.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById("chatTypingIndicator");
    if (el) el.remove();
  }

  /* ---------- Open / close ---------- */
  function openChat() {
    widget.classList.add("is-open");
    sessionStorage.setItem(CHAT_OPEN_KEY, "1");
    if (input) input.focus();
  }
  function closeChat() {
    widget.classList.remove("is-open");
    sessionStorage.removeItem(CHAT_OPEN_KEY);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      if (widget.classList.contains("is-open")) {
        closeChat();
      } else {
        openChat();
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeChat);

  // Restore open/closed state across page navigation within the same session
  if (sessionStorage.getItem(CHAT_OPEN_KEY) === "1") {
    widget.classList.add("is-open");
  }

  renderAllFromHistory();

  /* ---------- Sending messages ---------- */
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var message = (input.value || "").trim();
      if (!message) return;

      if (CHAT_API_BASE_URL.indexOf("YOUR-BACKEND-URL") !== -1) {
        renderMessage(
          "error",
          "The chat backend isn't configured yet — set CHAT_API_BASE_URL in js/chatbot.js to your deployed eventbot-backend URL."
        );
        return;
      }

      renderMessage("user", message);
      history.push({ role: "user", content: message });
      saveHistory(history);
      input.value = "";
      sendBtn.disabled = true;
      showTyping();

      fetch(CHAT_API_BASE_URL.replace(/\/$/, "") + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          // Only send prior turns, not the one we just added locally —
          // the backend appends the current message itself.
          history: history.slice(0, -1).slice(-10)
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed with status " + res.status);
          return res.json();
        })
        .then(function (data) {
          hideTyping();
          sendBtn.disabled = false;
          if (data && data.reply) {
            renderMessage("assistant", data.reply);
            history.push({ role: "assistant", content: data.reply });
            saveHistory(history);
          } else {
            renderMessage("error", "Sorry, I didn't get a response — please try again.");
          }
        })
        .catch(function () {
          hideTyping();
          sendBtn.disabled = false;
          renderMessage(
            "error",
            "Sorry, I'm having trouble connecting right now. Please try again in a moment, or reach us directly through the Contact page."
          );
        });
    });
  }
});
