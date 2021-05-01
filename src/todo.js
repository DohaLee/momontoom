"use strict";

const WEATHER_API_KEY = "e86739bafbd77ff2ba62cf7e47d0072a";

const LS_USERNAME = "USERNAME";
const LS_TODOS_PENDING = "PENDING";
const LS_TODOS_FINISHED = "FINISHED";

const BG_IMAGE_COUNT = 8;

const INVISIBLE_CSS_CLASS = "display-hidden";
const PENDINGLIST_TRANSLATE_X = "translateX";

const clock = document.querySelector(".clock span");
const linksButton = document.querySelector(".links-button");
const linksBox = document.querySelector(".links-box");
const finishedButton = document.querySelector(".to-do__finished-button");
const finishedBox = document.querySelector(".to-do__finished-box");

const temperatureElement = document.querySelector(".metric-stat__temperature");
const locationElement = document.querySelector(".metric-stat__location");

let userName = null;
const nameSpan = document.querySelector(".to-do__name");

const toDo = document.querySelector(".to-do");
const quote = document.querySelector(".quote");
const quoteForm = quote.querySelector(".quote__form");
const toDoForm = toDo.querySelector(".to-do__form");
const quoteInput = quoteForm.querySelector("input");
const toDoInput = toDoForm.querySelector("input");

const toDoUl = toDo.querySelector("ul");
const FinishedUl = document.querySelector(".to-do__finished-box ul");

const isTouchDevice = () =>
  navigator.maxTouchPoints || "ontouchstart" in document.documentElement;

function addPaddingToInt(int, n = 2) {
  const abs = Math.abs(int);
  const intStr = abs.toString();
  const length = intStr.length;
  if (length >= n) return int.toString();
  const minus = int < 0 ? "-" : "";
  return minus + "0".repeat(n - length) + intStr;
}

function getTime() {
  const date = new Date();
  const hours = addPaddingToInt(date.getHours());
  const minutes = addPaddingToInt(date.getMinutes());
  const seconds = addPaddingToInt(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
}

// ------------- Clock --------------
function setClock() {
  clock.innerText = getTime();
  setTimeout(setClock, 1000); // per 1 sec
}

// ------- Background Image ---------
function setBackgroundImage() {
  const bgNumber = Math.floor(Math.random() * BG_IMAGE_COUNT + 1);
  document.body.style.backgroundImage = `url("img/${bgNumber}.jpg")`;
  document.body.style.backgroundSize = "cover";
}

// ------------- Geo ----------------
function setMetric() {
  navigator.geolocation.getCurrentPosition(handleGeoSucces, handleGeoError);
  setInterval(setMetric, 300000); // per 5 min
}

function handleGeoSucces(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const coordsObj = {
    latitude,
    longitude,
  };
  getWeather(latitude, longitude);
}

function handleGeoError() {
  setMetricText("??", "Failed");
}

function getWeather(lat, lng) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
  )
    .then((response) => response.json())
    .then((json) => setMetricText(json.main.temp, json.name))
    .catch(handleGeoError());
}

function setMetricText(temp, loca) {
  temperatureElement.innerHTML = `<i class="fas fa-cloud-sun"></i>
          ${temp}℃`;
  locationElement.innerText = `${loca}`;
}

// ------------- Name ---------------
function setUsername() {
  const name = localStorage.getItem(LS_USERNAME);
  if (name) {
    setUsernameText(name);
    return true;
  }
  return false;
}
function setUsernameText(name) {
  userName = name;
  nameSpan.innerText = `Hello, ${name}`;
}

// ----------- Box State ------------
function toggleBoxes(elementAdd, elementRemove, css_class_name) {
  elementRemove.classList.remove(css_class_name);
  elementAdd.classList.add(css_class_name);
}

let pendingList = [];
let finishedList = [];

// ---------- Load To dos -----------
function loadToDos() {
  pendingList = [];
  finishedList = [];
  const pending = JSON.parse(localStorage.getItem(LS_TODOS_PENDING));
  if (pending) pending.forEach((obj) => createToDoPending(obj));
  const finished = JSON.parse(localStorage.getItem(LS_TODOS_FINISHED));
  if (finished) finished.forEach((obj) => createToDoFinished(obj));
}

// ---------- Save To dos -----------
function saveToDos() {
  localStorage.setItem(LS_TODOS_PENDING, JSON.stringify(pendingList));
  localStorage.setItem(LS_TODOS_FINISHED, JSON.stringify(finishedList));
}

function init() {
  setBackgroundImage();
  setMetric();
  setClock();
  if (setUsername()) {
    toggleBoxes(quote, toDo, INVISIBLE_CSS_CLASS);
    loadToDos();
    toDoInput.focus();
  }
}

init();

// Enter the Name
quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = quoteForm.querySelector("input");
  const name = input.value;
  localStorage.setItem(LS_USERNAME, name);
  setUsernameText(name);
  toggleBoxes(quote, toDo, INVISIBLE_CSS_CLASS);
  toDoInput.focus();
});

function createToDoFinished(obj) {
  const li = document.createElement("li");
  li.innerHTML = `<span>${obj.text}</span>
            <button class="back-to"><i class="fas fa-undo-alt"></i></button>`;
  li.addEventListener("click", () => {
    deleteObjInFinishedList(obj);
    createToDoPending(obj);
    saveToDos();
    FinishedUl.removeChild(li);
    playAnimation(toDoUl, "shaking", 100);
  });
  finishedList.push(obj);
  FinishedUl.appendChild(li);
}
function createToDoPending(obj) {
  const li = document.createElement("li");
  li.innerHTML = `<span class="ellipsis">${obj.text}</span>
              <div class="buttons ${INVISIBLE_CSS_CLASS}">
                <button class="delete"><i class="fas fa-trash-alt"></i></button>
                <button class="finish"><i class="fas fa-check"></i></button>
              </div>`;
  const toDoButtons = li.querySelector(".buttons");
  if (isTouchDevice()) {
    li.addEventListener("click", () => {
      toDoButtons.classList.toggle(INVISIBLE_CSS_CLASS);
      const liSpan = li.querySelector("span");
      liSpan.classList.toggle(PENDINGLIST_TRANSLATE_X);
    });
  } else {
    li.addEventListener("mouseenter", () =>
      toDoButtons.classList.remove(INVISIBLE_CSS_CLASS)
    );
    li.addEventListener("mouseleave", () =>
      toDoButtons.classList.add(INVISIBLE_CSS_CLASS)
    );
  }
  const toDoDelete = li.querySelector(".delete");
  const toDofinish = li.querySelector(".finish");

  toDoDelete.addEventListener("click", (event) => {
    deleteObjInPendingList(obj);
    saveToDos();
    toDoUl.removeChild(li);
  });
  toDofinish.addEventListener("click", (event) => {
    deleteObjInPendingList(obj);
    createToDoFinished(obj);
    saveToDos();
    toDoUl.removeChild(li);
    playAnimation(FinishedUl, "shaking", 100);
    playAnimation(finishedButton, "shaking-big", 100);
  });
  pendingList.push(obj);
  toDoUl.appendChild(li);
}

function deleteObjInPendingList(obj) {
  pendingList = pendingList.filter((target) => {
    return target.id !== obj.id;
  });
}
function deleteObjInFinishedList(obj) {
  finishedList = finishedList.filter((target) => {
    return target.id !== obj.id;
  });
}

// Enter the To do
toDoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = toDoForm.querySelector("input");
  const todo = input.value;
  createToDoPending({ id: new Date().getTime().toString(), text: todo });
  saveToDos();
  input.value = "";
  playAnimation(toDoUl, "shaking", 100);
});

function playAnimation(element, animationClass, duration) {
  element.classList.remove(animationClass);
  element.classList.add(animationClass);
  setTimeout(
    (target) => target.classList.remove(animationClass),
    duration,
    element
  );
}

function toggles(element, css_class_name1, css_class_name2) {
  element.classList.toggle(css_class_name1);
  element.classList.toggle(css_class_name2);
}

linksButton.addEventListener("click", () => {
  toggles(linksBox, "menu-opened", "menu-closed");
});

finishedButton.addEventListener("click", () => {
  toggles(finishedBox, "menu-opened", "menu-closed");
});
