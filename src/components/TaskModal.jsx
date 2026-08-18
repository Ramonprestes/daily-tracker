import React, { useState, useEffect } from "react";
import { X, Clock, Check } from "lucide-react";
import { getLocalDateString } from "../utils/dateUtils";

const PRESET_HOURS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
];

const WEEKDAYS = [
  { id: 1, label: "S" },
  { id: 2, label: "T" },
  { id: 3, label: "Q" },
  { id: 4, label: "Q" },
  { id: 5, label: "S" },
  { id: 6, label: "S" },
  { id: 0, label: "D" },
];

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  editingTask,
  initialDate,
}) {
  const [tarefa, setTarefa] = useState("");
  const [horario, setHorario] = useState("08:00");
  const [duracao, setDuracao] = useState("30 min");
  const [recurrenceType, setRecurrenceType] = useState("daily"); // daily, weekdays, weekends, custom, once
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [hasLimitDate, setHasLimitDate] = useState(false);
  const [untilDate, setUntilDate] = useState("");
  const [targetDate, setTargetDate] = useState(initialDate || getLocalDateString(new Date()));

  useEffect(() => {
    if (editingTask) {
      setTarefa(editingTask.tarefa || "");
      setHorario(editingTask.horario || "08:00");
      setDuracao(editingTask.duracao || "30 min");
      setRecurrenceType(editingTask.recurrenceType || "daily");
      setSelectedDays(editingTask.selectedDays || [1, 2, 3, 4, 5]);
      setHasLimitDate(Boolean(editingTask.untilDate));
      setUntilDate(editingTask.untilDate || "");
      setTargetDate(editingTask.targetDate || initialDate || getLocalDateString(new Date()));
    } else {
      setTarefa("");
      setHorario("08:00");
      setDuracao("30 min");
      setRecurrenceType("daily");
      setSelectedDays([1, 2, 3, 4, 5]);
      setHasLimitDate(false);
      setUntilDate("");
      setTargetDate(initialDate || getLocalDateString(new Date()));
    }
  }, [editingTask, initialDate, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tarefa.trim()) return;

    const taskPayload = {
      id: editingTask?.id || `${horario}_${tarefa.trim()}_${Date.now()}`,
      tarefa: tarefa.trim(),
      horario,
      duracao,
      recurrenceType,
      selectedDays: recurrenceType === "custom" ? selectedDays : null,
      untilDate: hasLimitDate ? untilDate : null,
      targetDate: recurrenceType === "once" ? targetDate : null,
    };

    onSave(taskPayload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingTask ? "Editar Tarefa" : "Nova Tarefa na Rotina"}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Nome da Tarefa */}
          <div className="form-group">
            <label>Nome da Tarefa</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Ex: Treino na academia, Reunião..."
              value={tarefa}
              onChange={(e) => setTarefa(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Horário e Duração */}
          <div className="form-group">
            <label>Horário Previsto & Duração</label>
            <div className="time-custom-row">
              <input
                type="time"
                className="modal-time-input"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
              />

              <div className="duration-select">
                <Clock size={16} />
                <select
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                >
                  <option value="15 min">15 min</option>
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="1h">1h</option>
                  <option value="1h 30m">1h 30m</option>
                  <option value="2h">2h</option>
                </select>
              </div>
            </div>

            {/* Chips de Horários Rápidos */}
            <div className="quick-times-grid">
              {PRESET_HOURS.map((hour) => (
                <button
                  type="button"
                  key={hour}
                  className={`chip-time ${horario === hour ? "active" : ""}`}
                  onClick={() => setHorario(hour)}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>

          {/* Repetição / Frequência */}
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

            {/* Dias Personalizados */}
            {recurrenceType === "custom" && (
              <div className="custom-days-selector">
                {WEEKDAYS.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    className={`day-circle ${selectedDays.includes(d.id) ? "selected" : ""}`}
                    onClick={() => toggleDay(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Apenas um dia selecionado */}
            {recurrenceType === "once" && (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="date"
                  className="modal-date-input"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{ width: "100%" }}
                  required
                />
              </div>
            )}
          </div>

          {/* Limite de Data */}
          {recurrenceType !== "once" && (
            <div className="form-group">
              <label className="checkbox-until">
                <input
                  type="checkbox"
                  checked={hasLimitDate}
                  onChange={(e) => setHasLimitDate(e.target.checked)}
                />
                <span>Definir data limite para encerrar esta rotina</span>
              </label>

              {hasLimitDate && (
                <input
                  type="date"
                  className="modal-date-input"
                  value={untilDate}
                  onChange={(e) => setUntilDate(e.target.value)}
                  style={{ marginTop: "8px", width: "100%" }}
                  required
                />
              )}
            </div>
          )}

          {/* Rodapé de Ações */}
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