import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Repeat, Check } from "lucide-react";

const QUICK_TIMES = [
  "06:00", "07:00", "08:00", "09:00",
  "10:00", "12:00", "14:00", "16:00",
  "18:00", "19:30", "21:00", "22:30"
];

const WEEK_DAYS = [
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
  { id: 0, label: "Dom" },
];

export default function TaskModal({ isOpen, onClose, onSave, editingTask, initialDate }) {
  if (!isOpen) return null;

  const [tarefa, setTarefa] = useState("");
  const [horario, setHorario] = useState("08:00");
  const [duracao, setDuracao] = useState("30m");
  const [recurrenceType, setRecurrenceType] = useState("daily"); // 'once' | 'daily' | 'weekdays' | 'weekends' | 'custom'
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [hasUntilDate, setHasUntilDate] = useState(false);
  const [untilDate, setUntilDate] = useState("");

  useEffect(() => {
    if (editingTask) {
      setTarefa(editingTask.tarefa || "");
      setHorario(editingTask.horario || "08:00");
      setDuracao(editingTask.duracao || "30m");
      setRecurrenceType(editingTask.recurrenceType || "daily");
      setSelectedDays(editingTask.selectedDays || [1, 2, 3, 4, 5]);
      setHasUntilDate(!!editingTask.untilDate);
      setUntilDate(editingTask.untilDate || "");
    } else {
      setTarefa("");
      setHorario("08:00");
      setDuracao("30m");
      setRecurrenceType("daily");
      setSelectedDays([1, 2, 3, 4, 5]);
      setHasUntilDate(false);
      setUntilDate("");
    }
  }, [editingTask, isOpen]);

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) return; // manter ao menos 1
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tarefa.trim()) return;

    const taskPayload = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      tarefa: tarefa.trim(),
      horario,
      duracao,
      recurrenceType,
      selectedDays: recurrenceType === "custom" ? selectedDays : [],
      targetDate: recurrenceType === "once" ? initialDate : null,
      untilDate: hasUntilDate ? untilDate : null,
    };

    onSave(taskPayload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* TÍTULO */}
          <div className="form-group">
            <label>O que você vai fazer?</label>
            <input
              type="text"
              placeholder="Ex: Treino de pernas, Reunião de alinhamento, Estudar React..."
              value={tarefa}
              onChange={(e) => setTarefa(e.target.value)}
              autoFocus
              className="modal-input"
              required
            />
          </div>

          {/* HORÁRIO & PRESETS */}
          <div className="form-group">
            <div className="label-with-hint">
              <label>Horário de Início</label>
              <span className="hint">ou clique em um atalho abaixo</span>
            </div>
            <div className="time-custom-row">
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="modal-time-input"
              />
              <div className="duration-select">
                <Clock size={15} />
                <select value={duracao} onChange={(e) => setDuracao(e.target.value)}>
                  <option value="15m">15 min</option>
                  <option value="30m">30 min</option>
                  <option value="45m">45 min</option>
                  <option value="1h">1 hora</option>
                  <option value="1h30">1h 30m</option>
                  <option value="2h">2 horas</option>
                  <option value="3h+">3h+</option>
                </select>
              </div>
            </div>

            <div className="quick-times-grid">
              {QUICK_TIMES.map((time) => (
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

          {/* RECORRÊNCIA */}
          <div className="form-group">
            <label className="label-icon">
              <Repeat size={16} /> Repetição
            </label>
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
                Dias úteis (Seg-Sex)
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
                Apenas {initialDate.slice(5).replace("-", "/")}
              </button>
            </div>

            {/* SELEÇÃO DE DIAS PERSONALIZADOS */}
            {recurrenceType === "custom" && (
              <div className="custom-days-selector">
                {WEEK_DAYS.map((d) => (
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
          </div>

          {/* DATA LIMITE (OPCIONAL) */}
          {recurrenceType !== "once" && (
            <div className="form-group until-group">
              <label className="checkbox-until">
                <input
                  type="checkbox"
                  checked={hasUntilDate}
                  onChange={(e) => setHasUntilDate(e.target.checked)}
                />
                <span>Definir data de término</span>
              </label>
              {hasUntilDate && (
                <input
                  type="date"
                  value={untilDate}
                  min={initialDate}
                  onChange={(e) => setUntilDate(e.target.value)}
                  className="modal-date-input"
                  required={hasUntilDate}
                />
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-modal-save">
              <Check size={16} /> Salvar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}