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
  const dayOfWeek = current.getDay(); // 0 = Domingo, 1 = Segunda...
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
      dayIndex: (i + 1) % 7, // 1 = Seg, 2 = Ter ... 0 = Dom
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

// Verifica se uma tarefa deve aparecer em uma data específica com base na sua regra de repetição
export function shouldTaskOccurOnDate(task, dateStr) {
  if (!task.recurrenceType || task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "once") {
    return task.targetDate ? task.targetDate === dateStr : true;
  }

  const d = new Date(dateStr + "T00:00:00");
  const dayOfWeek = d.getDay(); // 0 = Domingo, 1 = Seg ... 6 = Sab

  if (task.recurrenceType === "weekdays") {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }
  if (task.recurrenceType === "weekends") {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }
  if (task.recurrenceType === "custom" && Array.isArray(task.selectedDays)) {
    return task.selectedDays.includes(dayOfWeek);
  }

  // Verifica data limite de repetição
  if (task.untilDate && dateStr > task.untilDate) {
    return false;
  }

  return true;
}