/**********************
 * GLOBAL STATE
 **********************/
const state = {
  classes: {},       // { className: [{ name, id }] }
  attendance: {}     // { "YYYY-MM-DD": { className: { studentName: true/false } } }
};

let calendar;
let calendarRendered = false;
let needsRefetch = false;
let lastClickedDayEl = null;

/**********************
 * HELPERS
 **********************/
function $(id) {
  return document.getElementById(id);
}

function requireValue(input) {
  return input.value.trim().length > 0;
}

/**********************
 * ADD STUDENTS
 **********************/
const addStudentBtn = document.querySelector('#add-students button.primary');
const nameInput = document.querySelector('#add-students input[placeholder*="Student name"]');
const classInput = document.querySelector('#add-students input[placeholder*="CS"]');
const idInput = document.querySelector('#add-students input[placeholder*="ID"]');

addStudentBtn.addEventListener('click', () => {
  if (!requireValue(nameInput)) {
    alert('Student name is required.');
    return;
  }

  const className = classInput.value.trim() || 'Unnamed Class';
  const student = {
    name: nameInput.value.trim(),
    id: idInput.value.trim()
  };

  if (!state.classes[className]) state.classes[className] = [];
  state.classes[className].push(student);

  nameInput.value = '';
  idInput.value = '';

  renderStudentList();
  renderClassDropdown();
  renderAttendanceList();
  //refreshCalendar();
});

// ---------------------
// AUTOCOMPLETE FOR STUDENT NAMES
// ---------------------
let suggestionBox = document.createElement('ul');
suggestionBox.className = 'autocomplete-suggestions';
suggestionBox.style.position = 'absolute';
suggestionBox.style.background = 'white';
suggestionBox.style.border = '1px solid #ccc';
suggestionBox.style.listStyle = 'none';
suggestionBox.style.padding = '0';
suggestionBox.style.margin = '0';
suggestionBox.style.maxHeight = '150px';
suggestionBox.style.overflowY = 'auto';
suggestionBox.style.zIndex = '1000';
suggestionBox.style.display = 'none';
suggestionBox.style.width = `${nameInput.offsetWidth}px`;

const parent = nameInput.parentNode;
parent.style.position = 'relative';
parent.appendChild(suggestionBox);

function getAllStudentNames() {
  const names = new Set();
  Object.values(state.classes).forEach(students => {
    students.forEach(s => {
      if (s.name) names.add(s.name);
    });
  });
  return Array.from(names);
}

nameInput.addEventListener('input', () => {
  const val = nameInput.value.trim().toLowerCase();
  suggestionBox.innerHTML = '';
  if (!val) {
    suggestionBox.style.display = 'none';
    return;
  }

  const matches = getAllStudentNames().filter(n => n.toLowerCase().includes(val));
  if (matches.length === 0) {
    suggestionBox.style.display = 'none';
    return;
  }

  matches.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.style.padding = '4px 8px';
    li.style.cursor = 'pointer';
    li.addEventListener('mousedown', e => {
      e.preventDefault();
      nameInput.value = name;
      suggestionBox.style.display = 'none';
    });
    suggestionBox.appendChild(li);
  });

  suggestionBox.style.top = `${nameInput.offsetTop + nameInput.offsetHeight}px`;
  suggestionBox.style.left = `${nameInput.offsetLeft}px`;
  suggestionBox.style.width = `${nameInput.offsetWidth}px`;
  suggestionBox.style.display = 'block';
});

nameInput.addEventListener('blur', () => {
  setTimeout(() => { suggestionBox.style.display = 'none'; }, 100);
});

/**********************
 * RENDER STUDENTS BY CLASS
 **********************/
function renderStudentList() {
  const list = document.querySelector('.students-by-class');
  list.innerHTML = '';

  Object.entries(state.classes).forEach(([className, students]) => {
    const header = document.createElement('li');
    header.innerHTML = `<strong>${className}</strong>`;
    list.appendChild(header);

    students.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.id ? `${s.name} (${s.id})` : s.name;
      list.appendChild(li);
    });
  });
}

/**********************
 * TAKE ATTENDANCE
 **********************/
const classSelect = document.querySelector('#attendance select');
const dateInput = document.querySelector('#attendance input[type="date"]');
const attendanceList = document.querySelector('.attendance-list');
const saveAttendanceBtn = document.querySelector('#attendance button.primary');

function renderClassDropdown() {
  classSelect.innerHTML = '';
  Object.keys(state.classes).forEach(className => {
    const opt = document.createElement('option');
    opt.value = className;
    opt.textContent = className;
    classSelect.appendChild(opt);
  });
}

function renderAttendanceList() {
  attendanceList.innerHTML = '';

  const className = classSelect.value;
  const date = dateInput.value;

  if (!className || !date) return;
  if (!state.classes[className] || state.classes[className].length === 0) return;

  const saved = state.attendance[date]?.[className] || {};

  state.classes[className].forEach(student => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    label.className = 'attendance-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = saved[student.name] || false;

    const span = document.createElement('span');
    span.textContent = student.name;

    label.appendChild(checkbox);
    label.appendChild(span);
    li.appendChild(label);
    attendanceList.appendChild(li);
  });
}

classSelect.addEventListener('change', renderAttendanceList);
dateInput.addEventListener('change', renderAttendanceList);

/**********************
 * SAVE ATTENDANCE
 **********************/
saveAttendanceBtn.addEventListener('click', () => {
  const className = classSelect.value;
  const date = dateInput.value;

  if (!className || !state.classes[className] || state.classes[className].length === 0) {
    alert('Please select a valid class with students.');
    return;
  }

  if (!date) {
    alert('Please select a date.');
    return;
  }

  if (!state.attendance[date]) state.attendance[date] = {};
  state.attendance[date][className] = {};

  document.querySelectorAll('.attendance-row').forEach(row => {
    const checkbox = row.querySelector('input');
    const name = row.querySelector('span').textContent;
    state.attendance[date][className][name] = checkbox.checked;
  });

  alert('Attendance saved!');
  if ($('overview').classList.contains('active')) {
    calendar.refetchEvents();
  } else {
    needsRefetch = true;
  }
});

/**********************
 * CALENDAR INTEGRATION
 **********************/

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  const selectedDateText = document.getElementById('selectedDateText');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',

    events(fetchInfo, success) {
      success(Object.keys(state.attendance).map(date => ({
        id: `attendance-${date}`,
        start: date,
        allDay: true,
        display: 'background',
        backgroundColor: '#2563eb55'
      })));
    },

    dateClick(info) {
        const date = info.dateStr;
        const data = state.attendance[date];

        if (lastClickedDayEl) lastClickedDayEl.classList.remove('fc-day-selected');
        info.dayEl.classList.add('fc-day-selected');
        lastClickedDayEl = info.dayEl;

        selectedDateText.innerHTML = '';
        if (!data) {
        selectedDateText.textContent = `No attendance recorded for ${date}`;
        return;
        }

        Object.entries(data).forEach(([className, students]) => {
        const classHeader = document.createElement('h4');
        classHeader.textContent = className;
        selectedDateText.appendChild(classHeader);

        const totalStudents = Object.keys(students).length;
        const presentCount = Object.values(students).filter(Boolean).length;
        const percentPresent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

        const statsP = document.createElement('p');
        statsP.textContent = `Attendance: ${percentPresent}% present (${presentCount}/${totalStudents})`;
        statsP.style.fontStyle = 'italic';
        statsP.style.fontSize = '0.9rem';
        selectedDateText.appendChild(statsP);

        const ul = document.createElement('ul');
        Object.entries(students).forEach(([studentName, present]) => {
            const li = document.createElement('li');
            const studentObj = state.classes[className].find(s => s.name === studentName);
            const displayName = studentObj && studentObj.id ? `${studentName} (${studentObj.id})` : studentName;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = displayName;

            const statusSpan = document.createElement('span');
            statusSpan.textContent = present ? 'P' : 'A';

            li.appendChild(nameSpan);
            li.appendChild(statusSpan);
            ul.appendChild(li);
        });

        selectedDateText.appendChild(ul);
        });
    }
  });

  if (document.getElementById('overview').classList.contains('active')) {
    calendar.render();
    calendar.updateSize();
    calendarRendered = true;
  }


  // Do NOT render yet; render when Overview tab is shown
});

/**********************
 * SHOW PAGE / NAVIGATION
 **********************/
function showPage(pageId, btn) {
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));

  $(pageId).classList.add('active');
  btn.classList.add('active');

  if (pageId === 'overview') {
    if (!calendarRendered) {
      calendar.render();
      calendarRendered = true;
    }
    calendar.updateSize();

    if (needsRefetch) {
      calendar.refetchEvents();
      needsRefetch = false;
    }
  }
}

window.showPage = showPage;