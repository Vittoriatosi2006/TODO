import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal";
import "./App.css";

type Task = {
  text: string;
  completed: boolean;
  time?: string;
};

export default function ToDo() {
  const [tasksByDate, setTasksByDate] = useState<{
    [date: string]: Task[]; //ogni task ha una data e una task di tipo Task
  }>(() => {
    const saved = localStorage.getItem("tasksByDate"); //recupera i dati salvati nel LocalStorage
    return saved ? JSON.parse(saved) : {}; //se viene salvato nel LocalStorage, da testo in json si trasforma in oggetto js(json.parse), sennò riporta un oggetto vuoto
  });

  const [inputValue, setInputValue] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [inputTime, setInputTime] = useState("");
  const [editingTask, setEditingTask] = useState<{
    date: string;
    index: number;
  } | null>(null);

  const [confirmData, setConfirmData] = useState<{
    message: string;
    onConfirm: () => void; //alla conferma la task viene eliminata
  } | null>(null);

  useEffect(() => {
    localStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]); //ogni volta che cambia taskBydate, il contenuto viene salvato nel localStorage, e json stringfy trasforma l'oggetto js in testo in json per passarlo al server

  // Funzione per ordinare le task per completamento e orario
  function sortTasks(tasks: Task[]) {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed)
        // a e b sono opposti in completamento, quindi una è completata e l'altra no
        return Number(a.completed) - Number(b.completed); //le task non completate (false) vengono prima di quelle completate (true)

      if (a.time && b.time) {
        const [aH, aM] = a.time.split(":").map(Number); //split divide ore e minuti, es 14:30 in ["14","30"]
        const [bH, bM] = b.time.split(":").map(Number); //mmap trasforma in numeri
        return aH * 60 + aM - (bH * 60 + bM); //1 ora sono 60 minuti, quindi "14:30" → 14*60 + 30 = 870. Si sottraggono per metterli in ordine
      } else if (a.time)
        return -1; // a ha un orario, b no → a prima di b
      else if (b.time) return 1; // b ha un orario, a no → b prima di a

      return 0;
    });
  }

  function addTask() {
    if (inputValue.trim() === "" || selectedDate === "") return;

    const newTask: Task = {
      text: inputValue,
      completed: false,
      time: inputTime || undefined,
    };

    setTasksByDate((prev) => {
      const updated = { ...prev };

      if (editingTask) {
        const oldDate = editingTask.date;
        const oldIndex = editingTask.index;

        // rimuove la task dalla data vecchia
        const taskToEdit = updated[oldDate][oldIndex];
        updated[oldDate] = updated[oldDate].filter((_, i) => i !== oldIndex);

        if (updated[oldDate].length === 0) delete updated[oldDate];

        // crea la task modificata
        const editedTask: Task = {
          ...taskToEdit,
          text: inputValue,
          time: inputTime || undefined,
        };

        // aggiunge alla nuova data
        updated[selectedDate] = updated[selectedDate]
          ? [...updated[selectedDate], editedTask]
          : [editedTask];

        updated[selectedDate] = sortTasks(updated[selectedDate]);
      } else {
        updated[selectedDate] = prev[selectedDate]
          ? [...prev[selectedDate], newTask]
          : [newTask];

        updated[selectedDate] = sortTasks(updated[selectedDate]);
      }

      return updated;
    });

    setInputValue("");
    setInputTime("");
    setEditingTask(null);
  }

  function toggleTaskCompleted(date: string, indexToToggle: number) {
    setTasksByDate((prev) => {
      const updated = { ...prev }; //copia tutte le task esistenti
      //updated[date] è l'array di task della data selezionata
      updated[date] = updated[date].map((task, index) =>
        index === indexToToggle
          ? { ...task, completed: !task.completed } //se la task è completata la segna come non completata, e viceversa
          : task,
      );

      updated[date] = sortTasks(updated[date]); //le riordina
      return updated;
    });
  }

  function editTask(date: string, index: number) {
    const task = tasksByDate[date][index];

    setInputValue(task.text);
    setSelectedDate(date);
    setInputTime(task.time || "");

    setEditingTask({ date, index });
  }

  function removeTask(date: string, indexToRemove: number) {
    setConfirmData({
      message: "Sei sicura di voler eliminare questo task?",
      onConfirm: () => {
        setTasksByDate((prev) => {
          const updated = { ...prev };
          //updated[date] è l'array di task della data selezionata
          updated[date] = updated[date].filter(
            (_, index) => index !== indexToRemove, //crea un nuovo array con tutte le task tranne quella selezionata con index
          );
          if (updated[date].length === 0) delete updated[date]; //se dopo la rimozione di quella task non ce ne sono altre per quella data, elimina anche la data
          return updated;
        });
        setConfirmData(null);
      },
    });
  }

  function removeDay(date: string) {
    setConfirmData({
      message: `Sei sicura di voler eliminare tutti i task di ${formatDateLabel(
        date,
      )}?`,
      onConfirm: () => {
        setTasksByDate((prev) => {
          const updated = { ...prev };
          delete updated[date]; //elimina il giorno con tutte le sue task
          return updated;
        });

        setConfirmData(null);
      },
    });
  }

  function formatDateLabel(dateString: string, time?: string) {
    const date = new Date(dateString); //crea un oggetto data a partire dalla stringa, es "2024-06-15" → 15 giugno 2024
    let formatted = date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    //formatted.charAt(0) → prende la prima lettera "g"
    //.toUpperCase() → la trasforma in "G"
    //formatted.slice(1) → prende il resto della stringa ("iovedì 12/02")
    if (time) formatted += ` ${time}`; //se viene passato un orario, lo aggiunge alla fine del formato data
    return formatted;
  }

  return (
    <div className="todo-container">
      {/* CARD PRINCIPALE */}
      <div className="main-card">
        <h1> I miei impegni</h1>

        <input
          type="text"
          placeholder="Scrivi la tua task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        <div className="date-time-container">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={selectedDate ? "filled" : ""}
          />

          <input
            type="time"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            className={inputTime ? "filled" : ""}
          />
        </div>

        <button onClick={addTask} className="add-button">
          Salva
        </button>
      </div>
      {/*CARD X I GIORNI*/}
      <div className="days-section">
        <div className="days-wrapper">
          {/* Object prende l'oggetto taskByDate e restituisce una tupla con data e task*/}
          {Object.entries(tasksByDate)
            .sort(
              ([dateA], [dateB]) =>
                new Date(dateA).getTime() - new Date(dateB).getTime(),
            )
            .map(([date, tasks]) => (
              <div key={date} className="day-card">
                <div className="day-header">
                  <h2>{formatDateLabel(date)}</h2>
                  <button
                    onClick={() => removeDay(date)}
                    className="delete-day-button"
                  >
                    Elimina
                  </button>
                </div>

                <ul>
                  {tasks.map((task, index) => (
                    <li
                      key={index}
                      className={task.completed ? "task-completed" : ""}
                    >
                      <div className="task-content">
                        {task.time && (
                          <span className="task-time">{task.time}</span>
                        )}
                        <span className="task-text">{task.text}</span>
                      </div>

                      <div className="task-actions">
                        {/*task completata*/}
                        <button
                          onClick={() => toggleTaskCompleted(date, index)}
                          className="complete-button"
                          title="Segna come completata"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                        {/*task da modificare*/}
                        <button
                          onClick={() => editTask(date, index)}
                          className="edit-button"
                          title="Modifica task"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        {/*task da eliminare*/}
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
      {confirmData && (
        <ConfirmModal
          isOpen={true}
          message={confirmData.message}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}
    </div>
  );
}
