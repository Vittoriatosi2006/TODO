import { useState } from "react";
import "./App.css";

export default function ToDo() {
  const [tasksByDate, setTasksByDate] = useState<{
    [date: string]: string[];
  }>({});

  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  function addTask() {
    if (inputValue.trim() === "" || selectedDate === "") return;

    setTasksByDate((prev) => ({
      ...prev,
      [selectedDate]: prev[selectedDate]
        ? [...prev[selectedDate], inputValue] // crea un nuovo array con il task aggiunto
        : [inputValue], // se non esiste ancora, crea un nuovo array
    }));

    setInputValue("");
  }

  function removeTask(date: string, indexToRemove: number) {
    setTasksByDate((prev) => {
      const updated = { ...prev };

      updated[date] = updated[date].filter(
        (_, index) => index !== indexToRemove,
      );

      // Se non ci sono più task, elimina proprio il giorno
      if (updated[date].length === 0) {
        delete updated[date];
      }

      return updated;
    });
  }

  function removeDay(date: string) {
    setTasksByDate((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
  }
  return (
    <div className="todo-container">
      {/* CARD PRINCIPALE */}
      <div className="main-card">
        <h1>Todo Planner</h1>
        <input
          type="text"
          placeholder="Write a task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <button onClick={addTask} className="add-button">
          Add Task
        </button>
      </div>

      <div className="days-section">
        <div className="days-wrapper">
          {Object.entries(tasksByDate).map(([date, tasks]) => (
            <div key={date} className="day-card">
              <div className="day-header">
                <h2>{date.split("-").reverse().join("/")}</h2>{" "}
                {/* giorno/mese/anno*/}
                <button
                  onClick={() => removeDay(date)}
                  className="delete-day-button"
                >
                  ✕
                </button>
              </div>

              <ul>
                {tasks.map((task, index) => (
                  <li key={index}>
                    {task}
                    <button
                      onClick={() => removeTask(date, index)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
