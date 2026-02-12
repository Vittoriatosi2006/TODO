import { useEffect, useState } from "react";
import "./App.css";

type Task = {
  text: string;
  completed: boolean;
};

export default function ToDo() {
  const [tasksByDate, setTasksByDate] = useState<{
    [date: string]: Task[];
  }>(() => {
    const saved = localStorage.getItem("tasksByDate");
    return saved ? JSON.parse(saved) : {};
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);

  function addTask() {
    if (inputValue.trim() === "" || selectedDate === "") return;

    const newTask: Task = {
      text: inputValue,
      completed: false,
    };

    setTasksByDate((prev) => ({
      ...prev,
      [selectedDate]: prev[selectedDate]
        ? [...prev[selectedDate], newTask]
        : [newTask],
    }));

    setInputValue("");
  }

  function toggleTaskCompleted(date: string, indexToToggle: number) {
    setTasksByDate((prev) => {
      const updated = { ...prev };

      updated[date] = updated[date].map((task, index) =>
        index === indexToToggle
          ? { ...task, completed: !task.completed }
          : task,
      );

      // Metti le completate in fondo
      updated[date].sort((a, b) => Number(a.completed) - Number(b.completed));

      return updated;
    });
  }

  function removeTask(date: string, indexToRemove: number) {
    const confirmed = window.confirm(
      "Sei sicura di voler eliminare questo task?",
    );
    if (!confirmed) return;

    setTasksByDate((prev) => {
      const updated = { ...prev };

      updated[date] = updated[date].filter(
        (_, index) => index !== indexToRemove,
      );

      if (updated[date].length === 0) {
        delete updated[date];
      }

      return updated;
    });
  }

  function removeDay(date: string) {
    const confirmed = window.confirm(
      `Sei sicura di voler eliminare tutti i task di ${formatDateLabel(date)}?`,
    );
    if (!confirmed) return;

    setTasksByDate((prev) => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
  }

  function formatDateLabel(dateString: string) {
    const date = new Date(dateString);

    const formatted = date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
                <h2>{formatDateLabel(date)}</h2>
                <button
                  onClick={() => removeDay(date)}
                  className="delete-day-button"
                >
                  ✕
                </button>
              </div>

              <ul>
                {tasks.map((task, index) => (
                  <li
                    key={index}
                    className={task.completed ? "task-completed" : ""}
                  >
                    <span className="task-text">{task.text}</span>

                    <div className="task-actions">
                      {/* SPUNTA */}
                      <button
                        onClick={() => toggleTaskCompleted(date, index)}
                        className="complete-button"
                        title="Segna come completata"
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>

                      {/* CESTINO */}
                      <button
                        onClick={() => removeTask(date, index)}
                        className="trash-button"
                        title="Elimina task"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
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
