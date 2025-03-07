console.log("Music Sync: Content script loaded");

function getMediaElement(): HTMLMediaElement | null {

  //YouTube Music uses a <video> tag.
  //Spotify uses an <audio> tag.
  return document.querySelector("video, audio");
}

function sendMessage(event: string, currentTime?: number) {
  chrome.runtime.sendMessage({ event, currentTime });
}

function attachListeners() {
  const media = getMediaElement();
  if (!media) return;

  media.addEventListener("play", () => sendMessage("play"));
  media.addEventListener("pause", () => sendMessage("pause"));
  media.addEventListener("seeked", () => sendMessage("seek", media.currentTime));
}

setTimeout(attachListeners, 2000);
