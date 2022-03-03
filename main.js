import "normalize.css";
import "./style.scss";

const buttonRequest = document.getElementById("button-request");
const inputRequest = document.getElementById("input-location");

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("loading");
  buttonRequest.addEventListener("click", () => {
    loading(true);
    navigator.geolocation.getCurrentPosition((e) => {
      const {latitude, longitude} = e.coords
      inputRequest.value = `${latitude}, ${longitude}`;
      loading(false);
    }, error => {
      loading(false);
      console.error(error);
      const { message } = error;
      inputRequest.value = message || 'Error';
    }, { 
      enableHighAccuracy: true,
    })
  });

});


function loading(isLoading) {

  if (isLoading) {
    buttonRequest.disabled = true;
    buttonRequest.textContent = 'Loading…';
    return;
  }

  buttonRequest.disabled = false;
  buttonRequest.textContent = 'Request Current Location';
}