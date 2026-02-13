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
      const updated = {
        ...prev,
        //prende le task già esistenti per quella data
        [selectedDate]: prev[selectedDate] //se ci sono le riprende e ci aggiunge la nuova task
          ? [...prev[selectedDate], newTask]
          : [newTask], //altrimenti crea un nuovo array con la nuova task
      };

      // Ordina le task appena aggiunte
      updated[selectedDate] = sortTasks(updated[selectedDate]);
      return updated;
    });

    setInputValue("");
    setInputTime("");
  }

  function toggleTaskCompleted(date: string, indexToToggle: number) {
    setTasksByDate((prev) => {
      const updated = { ...prev }; //copia tutte le task esistenti
      //updated[date] è l'array di task della data selezionata
      updated[date] = updated[date].map((task, index) =>
        index === indexToToggle
          ? { ...task, completed: !task.completed }
          : task,
      );

      updated[date] = sortTasks(updated[date]);
      return updated;
    });
  }

  function removeTask(date: string, indexToRemove: number) {
    setConfirmData({
      message: "Sei sicura di voler eliminare questo task?",
      onConfirm: () => {
        setTasksByDate((prev) => {
          const updated = { ...prev };
          //updated[date] è l'array di task della data selezionata
          updated[date] = updated[date].filter(
            (_, index) => index !== indexToRemove, //crea u nuovo array con tutte le task tranne quella selezionata con index
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
        <h1> Le mie task</h1>

        <input
          type="text"
          placeholder="Scrivi una task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        <div className="date-time-container">
          <input
            type="text"
            placeholder="Seleziona data"
            value={selectedDate}
            onFocus={(e) => (e.target.type = "date")} //quando siclicca nell'input
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text"; //quando si esce dall'input
            }}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <input
            type="text"
            placeholder="Seleziona ora"
            value={inputTime}
            onFocus={(e) => (e.target.type = "time")}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text";
            }}
            onChange={(e) => setInputTime(e.target.value)}
          />
        </div>

        <button onClick={addTask} className="add-button">
          Aggiungi Task
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
                    x
                  </button>
                </div>

                <ul>
                  {tasks.map((task, index) => (
                    <li
                      key={index}
                      className={task.completed ? "task-completed" : ""}
                    >
                      <span className="task-text">
                        {task.text} {task.time && `(${task.time})`}
                      </span>

                      <div className="task-actions">
                        <button
                          onClick={() => toggleTaskCompleted(date, index)}
                          className="complete-button"
                          title="Segna come completata"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>

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
