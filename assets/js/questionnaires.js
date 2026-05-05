const PROTOCOL_VERSION = "v1.0";
const STORAGE_KEY_DATA = "donnees_experimentales";

/* -----------------------------
   Session participant
----------------------------- */

function getParticipantId() {
  return localStorage.getItem("participant_id");
}

function getConditionExperimentale() {
  return localStorage.getItem("condition_experimentale");
}

function getProtocolVersion() {
  return localStorage.getItem("protocol_version") || PROTOCOL_VERSION;
}

function getPhaseFromUrl(defaultPhase = "") {
  const params = new URLSearchParams(window.location.search);
  return params.get("phase") || defaultPhase;
}

function verifierSessionParticipant() {
  const participantId = getParticipantId();
  const condition = getConditionExperimentale();

  if (!participantId || !condition) {
    document.body.innerHTML = `
      <main class="card">
        <h1>Erreur de session</h1>
        <p>
          Aucun participant ou aucune condition expérimentale n’a été enregistré.
        </p>
        <p>
          Veuillez appeler l’expérimentateur.
        </p>
        <button onclick="goToDashboard()">
          Retour au tableau de bord
        </button>
      </main>
    `;
    return false;
  }

  return true;
}

function afficherInfosParticipant(elementId = "infosParticipant", afficherCondition = true) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  const participantId = getParticipantId();
  const condition = getConditionExperimentale();

  if (afficherCondition) {
    element.textContent =
      `Participant : ${participantId} | Condition : ${condition.toUpperCase()}`;
  } else {
    element.textContent =
      `Participant : ${participantId}`;
  }
}

/* -----------------------------
   Reprise de session
----------------------------- */

const STORAGE_KEY_REPRISE = "page_reprise";

function setPageReprise(url) {
  const absoluteUrl = new URL(url, window.location.href).href;
  localStorage.setItem(STORAGE_KEY_REPRISE, absoluteUrl);
}

function setPageRepriseActuelle() {
  localStorage.setItem(STORAGE_KEY_REPRISE, window.location.href);
}

function getPageReprise() {
  return localStorage.getItem(STORAGE_KEY_REPRISE);
}

function clearPageReprise() {
  localStorage.removeItem(STORAGE_KEY_REPRISE);
}

function naviguerVers(url) {
  setPageReprise(url);
  window.location.href = url;
}

document.addEventListener("DOMContentLoaded", function () {
  setPageRepriseActuelle();
});
/* -----------------------------
   Données locales
----------------------------- */

function getStoredData() {
  const rawData = localStorage.getItem(STORAGE_KEY_DATA);

  if (!rawData) {
    return [];
  }

  try {
    const parsedData = JSON.parse(rawData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData;
  } catch (error) {
    console.error("Erreur de lecture des données locales :", error);
    return [];
  }
}

function saveDataEntry(entry) {
  const existingData = getStoredData();
  existingData.push(entry);
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(existingData));
}

function clearStoredData() {
  localStorage.removeItem(STORAGE_KEY_DATA);
}

/* -----------------------------
   Entrée de base
----------------------------- */

function createBaseEntry({ questionnaire, phase, startTime }) {
  const endTime = new Date();
  const start = startTime instanceof Date ? startTime : new Date(startTime);

  return {
    protocol_version: getProtocolVersion(),
    participant_id: getParticipantId(),
    condition_experimentale: getConditionExperimentale(),
    questionnaire: questionnaire,
    phase: phase,
    date_heure_debut: start.toISOString(),
    date_heure_fin: endTime.toISOString(),
    duree_reponse_ms: endTime.getTime() - start.getTime()
  };
}

/* -----------------------------
   Réponses obligatoires
----------------------------- */

function showError(message, elementId = "messageErreur") {
  const errorBox = document.getElementById(elementId);

  if (!errorBox) {
    alert(message);
    return;
  }

  errorBox.style.display = "block";
  errorBox.textContent = message;
}

function hideError(elementId = "messageErreur") {
  const errorBox = document.getElementById(elementId);

  if (!errorBox) {
    return;
  }

  errorBox.style.display = "none";
  errorBox.textContent = "";
}

function requireChecked(inputId, errorMessage) {
  const input = document.getElementById(inputId);

  if (!input || !input.checked) {
    showError(errorMessage);
    return false;
  }

  hideError();
  return true;
}

function requireTextValue(inputId, errorMessage) {
  const input = document.getElementById(inputId);

  if (!input || !input.value.trim()) {
    showError(errorMessage);
    return null;
  }

  hideError();
  return input.value.trim();
}

function requireRadioGroup(name, errorMessage) {
  const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);

  if (!checkedRadio) {
    showError(errorMessage);
    return null;
  }

  hideError();
  return checkedRadio.value;
}

function requireAllRadioGroups(groupNames, errorMessage) {
  const values = {};

  for (const groupName of groupNames) {
    const value = requireRadioGroup(groupName, errorMessage);

    if (value === null) {
      return null;
    }

    values[groupName] = value;
  }

  return values;
}

function requireRangeValue(inputId, errorMessage) {
  const input = document.getElementById(inputId);

  if (!input || input.value === "") {
    showError(errorMessage);
    return null;
  }

  hideError();
  return Number(input.value);
}
function randomiserOrdreQuestions(containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  const questions = Array.from(container.children);

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  questions.forEach(question => container.appendChild(question));
}
/* -----------------------------
   SPES
----------------------------- */

function calculateSPESScores(responses) {
  const spes01 = Number(responses.spes_01);
  const spes02 = Number(responses.spes_02);
  const spes03 = Number(responses.spes_03);
  const spes04 = Number(responses.spes_04);
  const spes05 = Number(responses.spes_05);
  const spes06 = Number(responses.spes_06);
  const spes07 = Number(responses.spes_07);
  const spes08 = Number(responses.spes_08);

  const spesSlTotal = spes01 + spes02 + spes03 + spes04;
  const spesPaTotal = spes05 + spes06 + spes07 + spes08;
  const spesTotal = spesSlTotal + spesPaTotal;

  return {
    spes_sl_total: spesSlTotal,
    spes_pa_total: spesPaTotal,
    spes_total: spesTotal
  };
}

function saveSPESResponses({ phase, startTime, responses }) {
  const scores = calculateSPESScores(responses);

  const entry = {
    ...createBaseEntry({
      questionnaire: "spes",
      phase: phase,
      startTime: startTime
    }),
    ...responses,
    ...scores
  };

  saveDataEntry(entry);
  return entry;
}

/* -----------------------------
   Effort mental
----------------------------- */

function saveEvaluationPhaseResponse({
  phase,
  startTime,
  effortMental,
  plaisir,
  respectConsigne
}) {
  const entry = {
    ...createBaseEntry({
      questionnaire: "evaluation_phase",
      phase: phase,
      startTime: startTime
    }),
    effort_mental: Number(effortMental),
    plaisir: Number(plaisir),
    respect_consigne: Number(respectConsigne)
  };

  saveDataEntry(entry);
  return entry;
}

/* -----------------------------
   Consentement
----------------------------- */

function saveConsentementResponse({ startTime, accepted }) {
  const entry = {
    ...createBaseEntry({
      questionnaire: "consentement",
      phase: "pre_experience",
      startTime: startTime
    }),
    consentement_accepte: Boolean(accepted)
  };

  saveDataEntry(entry);
  return entry;
}

/* -----------------------------
   Redirections du protocole
----------------------------- */

/* -----------------------------
   Redirections du protocole
----------------------------- */

function getConditionFolder() {
  const condition = getConditionExperimentale();

  if (!condition) {
    return null;
  }

  return condition.toLowerCase();
}

function goToDashboard() {
  clearPageReprise();

  const path = window.location.pathname;

  if (path.includes("/questionnaires/vviq2/")) {
    window.location.href = "../../dashboard.html";
  } else if (path.includes("/questionnaires/")) {
    window.location.href = "../dashboard.html";
  } else if (path.includes("/ivs/") || path.includes("/im/") || path.includes("/si/")) {
    window.location.href = "../dashboard.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

function goToIntroduction() {
  naviguerVers("introduction.html");
}

function goToVVIQ2() {
  naviguerVers("vviq2/introduction.html");
}

function goToConditionFamiliarisation() {
  const condition = getConditionFolder();

  if (!condition) {
    goToDashboard();
    return;
  }

  naviguerVers(`../${condition}/familiarisation.html`);
}

function goToSPES(phase) {
  naviguerVers(`../questionnaires/spes.html?phase=${encodeURIComponent(phase)}`);
}

function goToEffort(phase) {
  naviguerVers(`../questionnaires/effort.html?phase=${encodeURIComponent(phase)}`);
}

function goToNextPhaseAfterEffort(phase) {
  const condition = getConditionFolder();

  if (!condition) {
    goToDashboard();
    return;
  }

  const nextPages = {
    familiarisation: `../${condition}/phase1.html`,
    phase1: `../${condition}/phase2.html`,
    phase2: `../${condition}/phase3.html`,
    phase3: `../${condition}/phase4.html`,
    phase4: "sociodemographie.html"
  };

  const nextPage = nextPages[phase];

  if (!nextPage) {
    showError("Erreur : phase inconnue. Veuillez appeler l’expérimentateur.");
    return;
  }

  naviguerVers(nextPage);
}

function goToSociodemographie() {
  naviguerVers("sociodemographie.html");
}

function goToFin() {
  naviguerVers("fin.html");
}

/* -----------------------------
   Export futur : préparation
----------------------------- */
function getDataForCurrentParticipant() {
  const participantId = getParticipantId();

  return getStoredData().filter(
    entry => entry.participant_id === participantId
  );
}
function calculateParticipantSummary(participantId = getParticipantId()) {
  const data = getStoredData().filter(
    entry => entry.participant_id === participantId
  );

  const spesEntries = data.filter(entry => entry.questionnaire === "spes");
  const evaluationEntries = data.filter(entry => entry.questionnaire === "evaluation_phase");
  const vviqEntry = data.find(entry => entry.questionnaire === "vviq2");
  const socioEntry = data.find(entry => entry.questionnaire === "sociodemographie");

  const summary = {
    protocol_version: getProtocolVersion(),
    participant_id: participantId,
    condition_experimentale:
      data.find(entry => entry.condition_experimentale)?.condition_experimentale || getConditionExperimentale()
  };

  /* VVIQ-2 */
  if (vviqEntry) {
    for (let i = 1; i <= 16; i++) {
      const itemNumber = String(i).padStart(2, "0");
      const key = `vviq_${itemNumber}`;
      summary[key] = vviqEntry[key];
    }

    summary.vviq_total = vviqEntry.vviq_total;
  }

  /* SPES */
  for (const entry of spesEntries) {
    const phase = entry.phase;

    summary[`spes_01_${phase}`] = entry.spes_01;
    summary[`spes_02_${phase}`] = entry.spes_02;
    summary[`spes_03_${phase}`] = entry.spes_03;
    summary[`spes_04_${phase}`] = entry.spes_04;
    summary[`spes_05_${phase}`] = entry.spes_05;
    summary[`spes_06_${phase}`] = entry.spes_06;
    summary[`spes_07_${phase}`] = entry.spes_07;
    summary[`spes_08_${phase}`] = entry.spes_08;

    summary[`spes_sl_total_${phase}`] = entry.spes_sl_total;
    summary[`spes_pa_total_${phase}`] = entry.spes_pa_total;
    summary[`spes_total_${phase}`] = entry.spes_total;
  }

  /* Évaluation de phase : effort mental + plaisir */
  for (const entry of evaluationEntries) {
    const phase = entry.phase;

    summary[`effort_mental_${phase}`] = entry.effort_mental;
    summary[`plaisir_${phase}`] = entry.plaisir;
    summary[`respect_consigne_${phase}`] = entry.respect_consigne;
  }

  const spesTotalValues = spesEntries
    .map(entry => Number(entry.spes_total))
    .filter(value => !Number.isNaN(value));

  const spesSlValues = spesEntries
    .map(entry => Number(entry.spes_sl_total))
    .filter(value => !Number.isNaN(value));

  const spesPaValues = spesEntries
    .map(entry => Number(entry.spes_pa_total))
    .filter(value => !Number.isNaN(value));

  const effortValues = evaluationEntries
    .map(entry => Number(entry.effort_mental))
    .filter(value => !Number.isNaN(value));

  const effortValuesPhases1To4 = evaluationEntries
    .filter(entry => ["phase1", "phase2", "phase3", "phase4"].includes(entry.phase))
    .map(entry => Number(entry.effort_mental))
    .filter(value => !Number.isNaN(value));

  const plaisirValues = evaluationEntries
    .map(entry => Number(entry.plaisir))
    .filter(value => !Number.isNaN(value));

  const plaisirValuesPhases1To4 = evaluationEntries
    .filter(entry => ["phase1", "phase2", "phase3", "phase4"].includes(entry.phase))
    .map(entry => Number(entry.plaisir))
    .filter(value => !Number.isNaN(value));
    const respectConsigneValues = evaluationEntries
   .map(entry => Number(entry.respect_consigne))
   .filter(value => !Number.isNaN(value));

  const respectConsigneValues = evaluationEntries
   .map(entry => Number(entry.respect_consigne))
   .filter(value => !Number.isNaN(value));

  const respectConsigneValuesPhases1To4 = evaluationEntries
   .filter(entry => ["phase1", "phase2", "phase3", "phase4"].includes(entry.phase))
    .map(entry => Number(entry.respect_consigne))
   .filter(value => !Number.isNaN(value));

  summary.spes_total_moyenne = mean(spesTotalValues);
  summary.spes_sl_moyenne = mean(spesSlValues);
  summary.spes_pa_moyenne = mean(spesPaValues);

  summary.effort_moyen_total_avec_familiarisation = mean(effortValues);
  summary.effort_moyen_phases_1_4 = mean(effortValuesPhases1To4);

  summary.plaisir_moyen_total_avec_familiarisation = mean(plaisirValues);
  summary.plaisir_moyen_phases_1_4 = mean(plaisirValuesPhases1To4);
  summary.respect_consigne_moyen_total_avec_familiarisation = mean(respectConsigneValues);
  summary.respect_consigne_moyen_phases_1_4 = mean(respectConsigneValuesPhases1To4);

  /* Sociodémographie */
  if (socioEntry) {
    summary.preference_vue = socioEntry.preference_vue;
    summary.connaissance_medieval_dynasty = socioEntry.connaissance_medieval_dynasty;
    summary.fatigue_generale_jour_experience = socioEntry.fatigue_generale_jour_experience;
    summary.age = socioEntry.age;
    summary.genre = socioEntry.genre;
  }

  return summary;
}

function mean(values) {
  if (!values || values.length === 0) {
    return "";
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}