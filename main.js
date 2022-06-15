import "normalize.css";
import "./style.scss";
import copy from "clipboard-copy";

const buttonRequest = document.getElementById("button-request");
const inputRequest = document.getElementById("input-location");
const buttonCopy = document.getElementById("button-copy");
const jsonEl = document.getElementById('json-output');


buttonCopy.addEventListener("click", async () => {
  buttonCopy.disabled = true;
  await copy(inputRequest.value);
  buttonCopy.textContent = "Copied";
  setTimeout(() => {
    buttonCopy.textContent = "Copy";
    buttonCopy.disabled = false;
  }, 1000);
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("loading");
  buttonRequest.addEventListener("click", () => {
    loading(true);
    navigator.geolocation.getCurrentPosition(
      (e) => {
        jsonEl.textContent = `accuracy=${e.coords.accuracy}, timestamp=${e.timestamp}`
        const { latitude, longitude } = e.coords;
        inputRequest.value = `${latitude}, ${longitude}`;
        loading(false);
      },
      (error) => {
        loading(false);
        console.error(error);
        const { message } = error;
        inputRequest.value = message || "Error";
      },
      {
        enableHighAccuracy: true,
      }
    );
  });
});

function loading(isLoading) {
  if (isLoading) {
    buttonRequest.disabled = true;
    buttonRequest.textContent = "Loading…";
    return;
  }

  buttonRequest.disabled = false;
  buttonRequest.textContent = "Request Current Location";
}
