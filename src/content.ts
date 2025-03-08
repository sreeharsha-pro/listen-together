console.log("🎵 Music Sync: Content script loaded");

function getMediaElement(): HTMLMediaElement | null {

  //YouTube Music uses a <video> tag.
  //Spotify uses an <audio> tag.
  return document.querySelector("video, audio");
}

function sendMessage(event: string, currentTime?: number, fromWebSocket = false) {
  if (fromWebSocket) return; // Prevent rebroadcast loop
  chrome.runtime.sendMessage({ event, currentTime });
}

let lastSeekTime: number | null = null;

function attachListeners() {
  const media = getMediaElement();
    if (!media) {
    console.warn("⚠️ No media element found, retrying...");
    setTimeout(attachListeners, 10000);
    return;
  }

  if (media.hasAttribute("data-music-sync")) return; // Prevent duplicate listeners
  media.setAttribute("data-music-sync", "true");

  console.log("🎥 Media element found, attaching event listeners.");

  // Attach new listeners
  media.addEventListener("play", onPlay);
  media.addEventListener("pause", onPause);
  media.addEventListener("seeked", onSeek);
}


function onPlay() {
  sendMessage("play", getMediaElement()?.currentTime);
}

function onPause() {
  sendMessage("pause", getMediaElement()?.currentTime);
}

function onSeek() {
  const media = getMediaElement();
  if (!media) return;
  if (Math.abs(media.currentTime - (lastSeekTime || 0)) > 0.1) {
    lastSeekTime = media.currentTime;
    sendMessage("seek", media.currentTime);
  }
}

// Listen for messages from background.ts
chrome.runtime.onMessage.addListener((message) => {
  console.log("📩 Content script received message from background:", message);
  const media = getMediaElement();
  if (!media) return;

  if (message.event === "play") {
    media.currentTime = message.currentTime;
    media.play();
  }
  if (message.event === "pause") {
    
    media.pause();
    media.currentTime = message.currentTime;
  }
  if (message.event === "seek" && message.currentTime !== undefined) {
    if (Math.abs(media.currentTime - message.currentTime) > 0.1) {
      lastSeekTime = message.currentTime;
      media.currentTime = message.currentTime;
    }
  }
});

attachListeners();
