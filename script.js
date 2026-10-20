const ATTENDANCE_GOAL = 50;
const STORAGE_KEY = "intel-sustainability-summit-attendance";
const TEAM_NAMES = {
  water: "Team Water Wise",
  zero: "Team Net Zero",
  power: "Team Renewables",
};

const checkInForm = document.getElementById("checkInForm");
const checkInDialog = document.getElementById("checkInDialog");
const openCheckInDialogButton = document.getElementById("openCheckInDialog");
const closeCheckInDialogButton = document.getElementById("closeCheckInDialog");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const greeting = document.getElementById("greeting");
const attendeeCount = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const progressContainer = document.querySelector(".progress-container");
const progressText = document.getElementById("progressText");
const attendeeList = document.getElementById("attendeeList");

let attendance = {
  total: 0,
  teams: {
    water: 0,
    zero: 0,
    power: 0,
  },
  attendees: [],
};
let storageWarning = "";

openCheckInDialogButton.addEventListener("click", function () {
  checkInDialog.hidden = false;
  document.body.classList.add("modal-open");
  nameInput.focus();
});

closeCheckInDialogButton.addEventListener("click", function () {
  closeCheckInDialog();
});

checkInDialog.addEventListener("click", function (event) {
  if (event.target === checkInDialog) {
    closeCheckInDialog();
  }
});

document.addEventListener("keydown", function (event) {
  if (checkInDialog.hidden) {
    return;
  }

  if (event.key === "Escape") {
    closeCheckInDialog();
    return;
  }

  if (event.key === "Tab") {
    const focusableElements = checkInDialog.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled])"
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
});

function closeCheckInDialog() {
  checkInDialog.hidden = true;
  document.body.classList.remove("modal-open");
  openCheckInDialogButton.focus();
}

function loadAttendance() {
  let savedAttendance;

  try {
    savedAttendance = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storageWarning = " Progress could not be loaded from this browser.";
    return;
  }

  if (savedAttendance === null) {
    return;
  }

  try {
    const savedData = JSON.parse(savedAttendance);
    const validData =
      savedData !== null &&
      typeof savedData === "object" &&
      savedData.teams !== null &&
      typeof savedData.teams === "object" &&
      Number.isInteger(savedData.total) &&
      savedData.total >= 0 &&
      Number.isInteger(savedData.teams.water) &&
      savedData.teams.water >= 0 &&
      Number.isInteger(savedData.teams.zero) &&
      savedData.teams.zero >= 0 &&
      Number.isInteger(savedData.teams.power) &&
      savedData.teams.power >= 0 &&
      Array.isArray(savedData.attendees) &&
      savedData.attendees.every(function (attendee) {
        return (
          typeof attendee.name === "string" &&
          attendee.name.trim() !== "" &&
          Object.prototype.hasOwnProperty.call(TEAM_NAMES, attendee.team)
        );
      });

    if (
      !validData ||
      savedData.total !==
        savedData.teams.water + savedData.teams.zero + savedData.teams.power ||
      savedData.total !== savedData.attendees.length
    ) {
      storageWarning = " Saved progress was invalid and could not be loaded.";
      return;
    }

    const attendeeTeamCounts = {
      water: 0,
      zero: 0,
      power: 0,
    };

    savedData.attendees.forEach(function (attendee) {
      attendeeTeamCounts[attendee.team] += 1;
    });

    if (
      savedData.teams.water !== attendeeTeamCounts.water ||
      savedData.teams.zero !== attendeeTeamCounts.zero ||
      savedData.teams.power !== attendeeTeamCounts.power
    ) {
      storageWarning = " Saved progress was invalid and could not be loaded.";
      return;
    }

    attendance = savedData;
  } catch (error) {
    storageWarning = " Saved progress could not be read.";
  }
}

function saveAttendance() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attendance));
    storageWarning = "";
  } catch (error) {
    storageWarning = " Progress could not be saved in this browser.";
  }
}

function showMessage(message, isSuccess, isCelebration) {
  greeting.textContent = message;
  greeting.className = isCelebration
    ? "success-message celebration-message"
    : isSuccess
      ? "success-message"
      : "warning-message";
  greeting.style.display = "block";
}

function updateAttendanceDisplay() {
  const percentage = Math.min(
    (attendance.total / ATTENDANCE_GOAL) * 100,
    100
  );

  attendeeCount.textContent = attendance.total;
  progressBar.style.width = `${percentage}%`;
  progressContainer.setAttribute(
    "aria-valuenow",
    Math.min(attendance.total, ATTENDANCE_GOAL)
  );
  progressText.textContent = `${Math.round(percentage)}% of the attendance goal`;

  document.getElementById("waterCount").textContent = attendance.teams.water;
  document.getElementById("zeroCount").textContent = attendance.teams.zero;
  document.getElementById("powerCount").textContent = attendance.teams.power;

  updateWinningTeams();
  updateAttendeeList();
}

function updateWinningTeams() {
  const highestCount = Math.max(
    attendance.teams.water,
    attendance.teams.zero,
    attendance.teams.power
  );

  Object.keys(TEAM_NAMES).forEach(function (team) {
    const teamCard = document.querySelector(`.team-card.${team}`);
    const isWinner =
      attendance.total >= ATTENDANCE_GOAL &&
      attendance.teams[team] === highestCount;

    teamCard.classList.toggle("is-winning-team", isWinner);
  });
}

function updateAttendeeList() {
  attendeeList.textContent = "";

  if (attendance.attendees.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-list";
    emptyMessage.textContent = "No attendees yet. Be the first to check in!";
    attendeeList.appendChild(emptyMessage);
    return;
  }

  attendance.attendees.forEach(function (attendee) {
    const listItem = document.createElement("li");
    const name = document.createElement("span");
    const team = document.createElement("span");

    name.className = "attendee-name";
    name.textContent = attendee.name;
    team.className = "attendee-team";
    team.textContent = TEAM_NAMES[attendee.team];
    listItem.appendChild(name);
    listItem.appendChild(team);
    attendeeList.appendChild(listItem);
  });
}

function getWinningTeamNames() {
  const highestCount = Math.max(
    attendance.teams.water,
    attendance.teams.zero,
    attendance.teams.power
  );
  const winningTeams = [];

  Object.keys(TEAM_NAMES).forEach(function (team) {
    if (attendance.teams[team] === highestCount) {
      winningTeams.push(TEAM_NAMES[team]);
    }
  });

  if (winningTeams.length > 1) {
    return `${winningTeams.join(" and ")} are tied for the lead`;
  }

  return `${winningTeams[0]} is the attendance leader`;
}

function showAttendanceGoalMessage() {
  const winner = getWinningTeamNames();
  showMessage(
    `Congratulations! We reached our goal of ${ATTENDANCE_GOAL} attendees. ${winner!}${storageWarning}`,
    storageWarning === "",
    true
  );
}

checkInForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const team = teamSelect.value;

  if (name === "" || !Object.prototype.hasOwnProperty.call(TEAM_NAMES, team)) {
    showMessage("Enter an attendee name and select a team to check in.", false);
    return;
  }

  const previousTotal = attendance.total;
  attendance.total += 1;
  attendance.teams[team] += 1;
  attendance.attendees.push({
    name: name,
    team: team,
  });

  saveAttendance();
  updateAttendanceDisplay();

  if (previousTotal < ATTENDANCE_GOAL && attendance.total >= ATTENDANCE_GOAL) {
    showAttendanceGoalMessage();
  } else {
    showMessage(
      `Welcome, ${name}! You checked in with ${TEAM_NAMES[team]}. Attendance: ${attendance.total}/${ATTENDANCE_GOAL}.${storageWarning}`,
      storageWarning === ""
    );
  }

  checkInForm.reset();
  closeCheckInDialog();
});

loadAttendance();
updateAttendanceDisplay();

if (attendance.total >= ATTENDANCE_GOAL) {
  showAttendanceGoalMessage();
} else if (storageWarning !== "") {
  showMessage(storageWarning.trim(), false);
}
