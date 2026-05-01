const PROTOCOL_VERSION = "v1.0";

function getCurrentParticipant() {
  return localStorage.getItem("participant_id");
}

function getCurrentCondition() {
  return localStorage.getItem("condition_experimentale");
}

function saveParticipantSettings(participantId, condition) {
  localStorage.setItem("participant_id", participantId);
  localStorage.setItem("condition_experimentale", condition);
  localStorage.setItem("protocol_version", PROTOCOL_VERSION);
  localStorage.setItem("session_start_time", new Date().toISOString());
}

function clearCurrentSession() {
  localStorage.removeItem("participant_id");
  localStorage.removeItem("condition_experimentale");
  localStorage.removeItem("protocol_version");
  localStorage.removeItem("session_start_time");
}

function initDashboard() {
  const inputParticipant = document.getElementById("participant");
  const selectCondition = document.getElementById("condition");
  const boutonEnregistrer = document.getElementById("boutonEnregistrer");
  const boutonDemarrer = document.getElementById("boutonDemarrer");
  const boutonReinitialiser = document.getElementById("boutonReinitialiser");
  const message = document.getElementById("message");
  const sessionInfo = document.getElementById("sessionInfo");

  const participantExistant = getCurrentParticipant();
  const conditionExistante = getCurrentCondition();

  if (participantExistant && conditionExistante) {
    inputParticipant.value = participantExistant;
    selectCondition.value = conditionExistante;
    afficherSessionActive();
  }

  boutonEnregistrer.addEventListener("click", function () {
    const participant = inputParticipant.value.trim();
    const condition = selectCondition.value;

    if (!participant) {
      alert("Veuillez indiquer un numéro de participant.");
      return;
    }

    if (!condition) {
      alert("Veuillez sélectionner une condition expérimentale.");
      return;
    }

    saveParticipantSettings(participant, condition);
    afficherSessionActive();
  });

  boutonDemarrer.addEventListener("click", function () {
    window.location.href = "questionnaires/consentement.html";
  });

  boutonReinitialiser.addEventListener("click", function () {
    const confirmation = confirm(
      "Voulez-vous vraiment réinitialiser la session actuelle ?"
    );

    if (!confirmation) {
      return;
    }

    clearCurrentSession();

    inputParticipant.value = "";
    selectCondition.value = "";

    message.style.display = "none";
    sessionInfo.innerHTML = "";
    boutonDemarrer.classList.add("hidden");
  });

  function afficherSessionActive() {
    const participant = getCurrentParticipant();
    const condition = getCurrentCondition();
    const version = localStorage.getItem("protocol_version");
    const startTime = localStorage.getItem("session_start_time");

    message.style.display = "block";
    message.innerHTML = `
      <strong>Paramètres enregistrés.</strong>
      <div class="info-line">Participant : ${participant}</div>
      <div class="info-line">Condition expérimentale : ${condition.toUpperCase()}</div>
    `;

    sessionInfo.innerHTML = `
      <h2>Session active</h2>
      <div class="info-line"><strong>Participant :</strong> ${participant}</div>
      <div class="info-line"><strong>Condition :</strong> ${condition.toUpperCase()}</div>
      <div class="info-line"><strong>Version du protocole :</strong> ${version}</div>
      <div class="info-line"><strong>Début de session :</strong> ${startTime}</div>
    `;

    boutonDemarrer.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);