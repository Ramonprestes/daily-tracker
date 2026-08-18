// Retorna a data no formato YYYY-MM-DD respeitando o fuso local do dispositivo
export function getLocalDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Retorna os 7 dias da semana correspondente à data informada (começando na Segunda-feira)
export function getWeekDays(currentDateStr) {
  const current = new Date(currentDateStr + "T00:00:00");
  const dayOfWeek = current.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const week = [];
  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(d);
    week.push({
      dateStr,
      dayNumber: d.getDate(),
      dayName: dayNames[i],
      dayIndex: (i + 1) % 7,
      isToday: dateStr === getLocalDateString(new Date()),
    });
  }
  return week;
}

// Retorna a grade do mês para o calendário
export function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  let startingDayOfWeek = firstDay.getDay();
  startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dateStr = getLocalDateString(dObj);
    days.push({
      dayNumber: d,
      dateStr,
      isToday: dateStr === getLocalDateString(new Date()),
    });
  }

  return days;
}

// Ordena lista de tarefas pelo horário HH:mm
export function sortTasksByTime(tasks = []) {
  return [...tasks].sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
}

// Verifica se uma tarefa é elegível para uma data específica
export function shouldTaskOccurOnDate(task, dateStr) {
  if (!task) return false;

  if (task.recurrenceType === "once") {
    return task.targetDate === dateStr;
  }

  if (task.untilDate && dateStr > task.untilDate) {
    return false;
  }

  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.getDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado

  if (!task.recurrenceType || task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (task.recurrenceType === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
  if (task.recurrenceType === "custom" && Array.isArray(task.selectedDays)) {
    return task.selectedDays.includes(dayOfWeek);
  }

  return true;
}

// Resolve sobreposição inteligente: tarefas 'once' no mesmo horário substituem as recorrentes naquele dia
export function resolveDayTasksWithOverrides(allTasks = [], dateStr) {
  const safeList = Array.isArray(allTasks) ? allTasks : [];
  const candidateTasks = safeList.filter((t) => shouldTaskOccurOnDate(t, dateStr));

  const onceTimes = new Set(
    candidateTasks.filter((t) => t.recurrenceType === "once").map((t) => t.horario)
  );

  const resolved = candidateTasks.filter((t) => {
    if (t.recurrenceType === "once") return true;
    return !onceTimes.has(t.horario);
  });

  return sortTasksByTime(resolved);
}

// Converte string "HH:mm" para minutos totais do dia
export function timeToMinutes(timeStr = "00:00") {
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Obtém horário atual local em formato "HH:mm"
export function getCurrentTimeStr() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

// Avalia se o horário agendado excedeu a tolerância de 15 minutos
export function getTaskDelayInfo(taskTime, taskDateStr) {
  const todayStr = getLocalDateString(new Date());
  if (taskDateStr !== todayStr) return { isOverdue: false, delayMinutes: 0 };

  const currentMinutes = timeToMinutes(getCurrentTimeStr());
  const scheduledMinutes = timeToMinutes(taskTime);
  const diff = currentMinutes - scheduledMinutes;

  return {
    isOverdue: diff > 15,
    delayMinutes: diff,
  };
}
