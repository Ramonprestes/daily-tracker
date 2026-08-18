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
  // Ajusta para a segunda-feira ser o dia 0
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
      isToday: dateStr === getLocalDateString(new Date()),
    });
  }
  return week;
}

// Retorna a grade do mês para o calendário (com dias vazios antes do início)
export function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  let startingDayOfWeek = firstDay.getDay(); // 0 = Domingo
  // Ajuste para começar na Segunda (0 = Seg, 6 = Dom)
  startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const days = [];
  // Espaços vazios
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Dias do mês
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