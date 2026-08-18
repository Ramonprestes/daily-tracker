import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Check } from "lucide-react";

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  editingTask = null,
  initialDate,
}) {
  const [tarefa, setTarefa] = useState("");
  const [horario, setHorario] = useState("08:00");
  const [duracao, setDuracao] = useState("30m");
  const [recurrenceType, setRecurrenceType] = useState("daily"); // daily, weekdays, weekends, custom, once
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // 1=Seg..5=Sex
  const [hasUntil, setHasUntil] = useState(false);
  const [untilDate, setUntilDate] = useState("");
  const [targetDate, setTargetDate] = useState(initialDate || "");

  useEffect(() => {
    if (editingTask) {
      setTarefa(editingTask.tarefa || "");
      setHorario(editingTask.horario || "08:00");
      setDuracao(editingTask.duracao || "30m");
      setRecurrenceType(editingTask.recurrenceType || "daily");
      setSelectedDays(editingTask.selectedDays || [1, 2, 3, 4, 5]);
      setHasUntil(Boolean(editingTask.untilDate));
      setUntilDate(editingTask.untilDate || "");
      setTargetDate(editingTask.targetDate || initialDate || "");
    } else {
      setTarefa("");
      setHorario("08:00");
      setDuracao("30m");
      setRecurrenceType("daily");
      setSelectedDays([1, 2, 3, 4, 5]);
      setHasUntil(false);
      setUntilDate("");
      setTargetDate(initialDate || "");
    }
  }, [editingTask, isOpen, initialDate]);

  if (!isOpen) return null;

  const handleToggleDay = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tarefa.trim() || !horario) return;

    const taskPayload = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      tarefa: tarefa.trim(),
      horario,
      duracao,
      recurrenceType,
      selectedDays: recurrenceType === "custom" ? selectedDays : undefined,
      untilDate: hasUntil && recurrenceType !== "once" ? untilDate : undefined,
      targetDate: recurrenceType === "once" ? targetDate : undefined,
    };

    onSave(taskPayload);
    onClose();
  };

  const quickTimes = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{editingTask ? "Editar Tarefa" : "Nova Tarefa na Rotina"}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Nome da Tarefa */}
          <div className="form-group">
            <label>Nome da Tarefa</label>
            <input
              type="text"
              placeholder="Ex: Treino na academia, Reunião de equipe..."
              value={tarefa}
              onChange={(e) => setTarefa(e.target.value)}
              required
              className="modal-input"
              autoFocus
            />
          </div>

          {/* Horário e Duração */}
          <div className="form-group">
            <label>Horário Previsto & Duração</label>
            <div className="time-custom-row">
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
                className="modal-time-input"
              />
              <div className="duration-select">
                <Clock size={15} />
                <select
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                >
                  <option value="15m">15 min</option>
                  <option value="30m">30 min</option>
                  <option value="45m">45 min</option>
                  <option value="1h">1 hora</option>
                  <option value="1h30">1h 30m</option>
                  <option value="2h">2 horas</option>
                  <option value="3h+">3h ou mais</option>
                </select>
              </div>
            </div>

            {/* Chips de Horários Rápidos */}
            <div className="quick-times-grid">
              {quickTimes.map((time) => (
                <button
                  type="button"
                  key={time}
                  className={`chip-time ${horario === time ? "active" : ""}`}
                  onClick={() => setHorario(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Recorrência */}
          <div className="form-group">
            <label>Repetição / Frequência</label>
            <div className="recurrence-options">
              <button
                type="button"
                className={`btn-rec ${recurrenceType === "daily" ? "active" : ""}`}
                onClick={() => setRecurrenceType("daily")}
              >
                Todos os dias
              </button>
              <button
                type="button"
                className={`btn-rec ${recurrenceType === "weekdays" ? "active" : ""}`}
                onClick={() => setRecurrenceType("weekdays")}
              >
                Seg a Sex
              </button>
              <button
                type="button"
                className={`btn-rec ${recurrenceType === "weekends" ? "active" : ""}`}
                onClick={() => setRecurrenceType("weekends")}
              >
                Fins de semana
              </button>
              <button
                type="button"
                className={`btn-rec ${recurrenceType === "custom" ? "active" : ""}`}
                onClick={() => setRecurrenceType("custom")}
              >
                Personalizado
              </button>
              <button
                type="button"
                className={`btn-rec ${recurrenceType === "once" ? "active" : ""}`}
                onClick={() => setRecurrenceType("once")}
              >
                Apenas um dia
              </button>
            </div>

            {/* Dias personalizados */}
            {recurrenceType === "custom" && (
              <div className="custom-days-selector">
                {[
                  { label: "D", val: 0 },
                  { label: "S", val: 1 },
                  { label: "T", val: 2 },
                  { label: "Q", val: 3 },
                  { label: "Q", val: 4 },
                  { label: "S", val: 5 },
                  { label: "S", val: 6 },
                ].map((d) => (
                  <button
                    type="button"
                    key={d.val}
                    className={`day-circle ${selectedDays.includes(d.val) ? "selected" : ""}`}
                    onClick={() => handleToggleDay(d.val)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Data única (Override) */}
            {recurrenceType === "once" && (
              <div style={{ marginTop: "8px" }}>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="modal-date-input"
                  required
                />
              </div>
            )}
          </div>

          {/* Validade da tarefa */}
          {recurrenceType !== "once" && (
            <div className="form-group">
              <label className="checkbox-until">
                <input
                  type="checkbox"
                  checked={hasUntil}
                  onChange={(e) => setHasUntil(e.target.checked)}
                />
                Definir data limite para encerrar esta rotina
              </label>
              {hasUntil && (
                <input
                  type="date"
                  value={untilDate}
                  onChange={(e) => setUntilDate(e.target.value)}
                  className="modal-date-input"
                  required={hasUntil}
                  style={{ marginTop: "6px" }}
                />
              )}
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-modal-save">
              <Check size={16} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
