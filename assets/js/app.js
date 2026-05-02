const PROTOCOL_VERSION = "v1.0";
const STORAGE_KEY_DATA = "donnees_experimentales";
const STORAGE_KEY_REPRISE = "page_reprise";

/* -----------------------------
   Session participant
----------------------------- */

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
  clearPageReprise();
}

function getPageReprise() {
  return localStorage.getItem(STORAGE_KEY_REPRISE);
}

function clearPageReprise() {
  localStorage.removeItem(STORAGE_KEY_REPRISE);
}

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

function getDataForParticipant(participantId) {
  return getStoredData().filter(
    entry => entry.participant_id === participantId
  );
}

function getProtocolVersion() {
  return localStorage.getItem("protocol_version") || PROTOCOL_VERSION;
}

function mean(values) {
  if (!values || values.length === 0) {
    return "";
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function calculateParticipantSummary(participantId = getCurrentParticipant()) {
  const data = getDataForParticipant(participantId);

  const spesEntries = data.filter(entry => entry.questionnaire === "spes");
  const evaluationEntries = data.filter(entry => entry.questionnaire === "evaluation_phase");
  const vviqEntry = data.find(entry => entry.questionnaire === "vviq2");
  const socioEntry = data.find(entry => entry.questionnaire === "sociodemographie");

  const summary = {
    protocol_version: getProtocolVersion(),
    participant_id: participantId,
    condition_experimentale: getCurrentCondition()
  };

  if (vviqEntry) {
    for (let i = 1; i <= 16; i++) {
      const itemNumber = String(i).padStart(2, "0");
      const key = `vviq_${itemNumber}`;
      summary[key] = vviqEntry[key];
    }

    summary.vviq_total = vviqEntry.vviq_total;
  }

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

  for (const entry of evaluationEntries) {
    const phase = entry.phase;

    summary[`effort_mental_${phase}`] = entry.effort_mental;
    summary[`plaisir_${phase}`] = entry.plaisir;
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

  summary.spes_total_moyenne = mean(spesTotalValues);
  summary.spes_sl_moyenne = mean(spesSlValues);
  summary.spes_pa_moyenne = mean(spesPaValues);

  summary.effort_moyen_total_avec_familiarisation = mean(effortValues);
  summary.effort_moyen_phases_1_4 = mean(effortValuesPhases1To4);

  summary.plaisir_moyen_total_avec_familiarisation = mean(plaisirValues);
  summary.plaisir_moyen_phases_1_4 = mean(plaisirValuesPhases1To4);

  if (socioEntry) {
    summary.preference_vue = socioEntry.preference_vue;
    summary.connaissance_medieval_dynasty = socioEntry.connaissance_medieval_dynasty;
    summary.fatigue_generale_jour_experience = socioEntry.fatigue_generale_jour_experience;
    summary.age = socioEntry.age;
    summary.genre = socioEntry.genre;
  }

  return summary;
}

/* -----------------------------
   Export
----------------------------- */

function telechargerJSON(nomFichier, donnees) {
  const contenu = JSON.stringify(donnees, null, 2);
  const blob = new Blob([contenu], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();

  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

function convertirObjetEnCSV(objets) {
  if (!objets || objets.length === 0) {
    return "";
  }

  const colonnes = Array.from(
    objets.reduce((set, objet) => {
      Object.keys(objet).forEach(key => set.add(key));
      return set;
    }, new Set())
  );

  const lignes = objets.map(objet => {
    return colonnes.map(colonne => {
      const valeur = objet[colonne] ?? "";
      return `"${String(valeur).replace(/"/g, '""')}"`;
    }).join(";");
  });

  return [
    colonnes.join(";"),
    ...lignes
  ].join("\n");
}

function telechargerCSV(nomFichier, objets) {
  const contenuCSV = convertirObjetEnCSV(objets);
  const blob = new Blob(["\uFEFF" + contenuCSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();

  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

/* -----------------------------
   Dashboard
----------------------------- */

function initDashboard() {
  const inputParticipant = document.getElementById("participant");
  const selectCondition = document.getElementById("condition");

  const boutonReprendre = document.getElementById("boutonReprendre");  
  const boutonEnregistrer = document.getElementById("boutonEnregistrer");
  const boutonDemarrer = document.getElementById("boutonDemarrer");
  const boutonReinitialiser = document.getElementById("boutonReinitialiser");

  const boutonExporterJSON = document.getElementById("boutonExporterJSON");
  const boutonExporterSyntheseJSON = document.getElementById("boutonExporterSyntheseJSON");
  const boutonExporterSyntheseCSV = document.getElementById("boutonExporterSyntheseCSV");
  const boutonAfficherDonnees = document.getElementById("boutonAfficherDonnees");

  const message = document.getElementById("message");
  const sessionInfo = document.getElementById("sessionInfo");
  const resumeDonnees = document.getElementById("resumeDonnees");

  const participantExistant = getCurrentParticipant();
  const conditionExistante = getCurrentCondition();

  if (participantExistant && conditionExistante) {
    inputParticipant.value = participantExistant;
    selectCondition.value = conditionExistante;
    afficherSessionActive();
  }

  boutonReprendre.addEventListener("click", function () {
    const pageReprise = getPageReprise();

     if (!pageReprise) {
       alert("Aucune page de reprise n’est enregistrée.");
       return;
    }

     window.location.href = pageReprise;
    });

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
  const pageReprise = getPageReprise();
  
  if (pageReprise) {
    boutonReprendre.classList.remove("hidden");
  } else {
    boutonReprendre.classList.add("hidden");
  }  

  boutonDemarrer.addEventListener("click", function () {
    window.location.href = "questionnaires/consentement.html";
  });

  boutonReinitialiser.addEventListener("click", function () {
    const confirmation = confirm(
      "Voulez-vous vraiment réinitialiser la session actuelle ? Les données déjà enregistrées resteront dans le navigateur."
    );

    if (!confirmation) {
      return;
    }

    clearCurrentSession();

    inputParticipant.value = "";
    selectCondition.value = "";

    message.style.display = "none";
    sessionInfo.innerHTML = `
      <h2>Session active</h2>
      <p>Aucune session participant n’est actuellement enregistrée.</p>
    `;

    resumeDonnees.style.display = "none";
    resumeDonnees.innerHTML = "";

    boutonDemarrer.classList.add("hidden");
    masquerBoutonsExport();
  });

  boutonAfficherDonnees.addEventListener("click", function () {
    const participantId = getCurrentParticipant();

    if (!participantId) {
      alert("Aucun participant actif.");
      return;
    }

    const donneesParticipant = getDataForParticipant(participantId);
    const synthese = calculateParticipantSummary(participantId);

    resumeDonnees.style.display = "block";
    resumeDonnees.innerHTML = `
      <strong>Données du participant ${participantId}</strong><br>
      Nombre d’entrées détaillées enregistrées : ${donneesParticipant.length}<br><br>
      <strong>Synthèse disponible :</strong><br>
      VVIQ total : ${synthese.vviq_total ?? "non disponible"}<br>
      Âge : ${synthese.age ?? "non disponible"}<br>
      Genre : ${synthese.genre ?? "non disponible"}<br>
      SPES moyen : ${synthese.spes_total_moyenne ?? "non disponible"}<br>
      Effort moyen phases 1 à 4 : ${synthese.effort_moyen_phases_1_4 ?? "non disponible"}<br>
      Plaisir moyen phases 1 à 4 : ${synthese.plaisir_moyen_phases_1_4 ?? "non disponible"}
    `;
  });

  boutonExporterJSON.addEventListener("click", function () {
    const participantId = getCurrentParticipant();

    if (!participantId) {
      alert("Aucun participant actif.");
      return;
    }

    const donneesParticipant = getDataForParticipant(participantId);

    telechargerJSON(
      `donnees_detaillees_${participantId}.json`,
      donneesParticipant
    );
  });

  boutonExporterSyntheseJSON.addEventListener("click", function () {
    const participantId = getCurrentParticipant();

    if (!participantId) {
      alert("Aucun participant actif.");
      return;
    }

    const synthese = calculateParticipantSummary(participantId);

    telechargerJSON(
      `synthese_${participantId}.json`,
      synthese
    );
  });

  boutonExporterSyntheseCSV.addEventListener("click", function () {
    const participantId = getCurrentParticipant();

    if (!participantId) {
      alert("Aucun participant actif.");
      return;
    }

    const synthese = calculateParticipantSummary(participantId);

    telechargerCSV(
      `synthese_${participantId}.csv`,
      [synthese]
    );
  });

  function afficherSessionActive() {
    const participant = getCurrentParticipant();
    const condition = getCurrentCondition();
    const version = localStorage.getItem("protocol_version");
    const startTime = localStorage.getItem("session_start_time");
    const nbEntrees = getDataForParticipant(participant).length;

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
      <div class="info-line"><strong>Entrées enregistrées :</strong> ${nbEntrees}</div>
    `;

    boutonDemarrer.classList.remove("hidden");
    afficherBoutonsExport();
  }

  function afficherBoutonsExport() {
    boutonAfficherDonnees.classList.remove("hidden");
    boutonExporterJSON.classList.remove("hidden");
    boutonExporterSyntheseJSON.classList.remove("hidden");
    boutonExporterSyntheseCSV.classList.remove("hidden");
  }

  function masquerBoutonsExport() {
    boutonAfficherDonnees.classList.add("hidden");
    boutonExporterJSON.classList.add("hidden");
    boutonExporterSyntheseJSON.classList.add("hidden");
    boutonExporterSyntheseCSV.classList.add("hidden");
    boutonReprendre.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);