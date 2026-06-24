import { useEffect, useRef, useState } from "react";
import { FiHome } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../api";
import AnalyticsCharts from './AnalyticsCharts';
import "./TestDetails.css";

export default function TestDetails() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [studentTests, setStudentTests] = useState([]);

  const [activeTab, setActiveTab] = useState("results");

  const [statistics, setStatistics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showThresholdsModal, setShowThresholdsModal] = useState(false);

  const [meanLow, setMeanLow] = useState(0.4);
  const [varianceLow, setVarianceLow] = useState(0.15);
  const [varianceHigh, setVarianceHigh] = useState(0.18);
  const [uncertaintyHigh, setUncertaintyHigh] = useState(0.4);
  const [successHigh, setSuccessHigh] = useState(0.75);
  const [relativeDifficultyLow, setRelativeDifficultyLow] = useState("-0.25");
  const [zeroScoreHigh, setZeroScoreHigh] = useState("0.35");
  const [shockIndexHigh, setShockIndexHigh] = useState("0.3");
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [finalScore, setFinalScore] = useState("");
  const [taskTopic, setTaskTopic] = useState("");
  const [taskHours, setTaskHours] = useState("");

  const [editingCell, setEditingCell] = useState({
    studentId: null,
    taskId: null,
  });

  const tableRef = useRef(null);

   useEffect(() => {
    apiGet(`/tests/${testId}/`).then((data) => {
      setTest(data);
      setTasks(data.tasks || []);
      
      setMeanLow(data.threshold_mean_low ?? 0.4);
      setVarianceLow(data.threshold_variance_low ?? 0.15);
      setVarianceHigh(data.threshold_variance_high ?? 0.18);
      setUncertaintyHigh(data.threshold_uncertainty_high ?? 0.4);
      setSuccessHigh(data.threshold_success_high ?? 0.75);
      setRelativeDifficultyLow(data.threshold_relative_difficulty_low ?? -0.25);
      setZeroScoreHigh(data.threshold_zero_score_high ?? 0.35);
      setShockIndexHigh(data.threshold_shock_index_high ?? 0.3);
    });

    apiGet(`/student-tests/?test=${testId}`).then(setStudentTests);
  }, [testId]);

  useEffect(() => {
    if (activeTab === "statistics" && !statistics) {
      apiGet(`/tests/${testId}/statistics/`).then((data) => {
        setStatistics(data.statistics);
      });
    }
  }, [activeTab, statistics, testId]);

  useEffect(() => {
    if (activeTab === "recommendations" && !recommendations) {
      apiGet(`/tests/${testId}/recommendations/`).then((data) => {
        setRecommendations(data.recommendations);
      });
    }
  }, [activeTab, recommendations, testId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setEditingCell({ studentId: null, taskId: null });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const addStudentTest = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || finalScore === "") return;

    const newStudentTest = await apiPost("/student-tests/", {
      student_name: studentName,
      final_score: parseFloat(finalScore),
      test_id: testId,
    });

    setStudentTests((prev) => [...prev, newStudentTest]);
    setShowStudentModal(false);
    setStudentName("");
    setFinalScore("");
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskTopic.trim() || taskHours === "") return;

    const newTask = await apiPost("/tasks/", {
      test: testId,
      topic: taskTopic,
      hours: parseFloat(taskHours),
    });

    setTasks((prev) => [...prev, newTask]);
    setShowTaskModal(false);
    setTaskTopic("");
    setTaskHours("");
  };

  const updateThresholds = async (e) => {
    e.preventDefault();
    
    const updatedTest = await apiPatch(`/tests/${testId}/`, {
      threshold_mean_low: parseFloat(meanLow),
      threshold_variance_low: parseFloat(varianceLow),
      threshold_variance_high: parseFloat(varianceHigh),
      threshold_uncertainty_high: parseFloat(uncertaintyHigh),
      threshold_success_high: parseFloat(successHigh),
      
      threshold_relative_difficulty_low: parseFloat(relativeDifficultyLow),
      threshold_zero_score_high: parseFloat(zeroScoreHigh),
      threshold_shock_index_high: parseFloat(shockIndexHigh),
    });

    setTest(updatedTest);
    setShowThresholdsModal(false);
    
    setStatistics(null);
    setRecommendations(null);
  };

    const exportToExcel = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `http://127.0.0.1:8000/api/tests/${testId}/export-excel/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `test_${testId}_results.xlsx`;

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Ошибка скачивания Excel:", err);
        alert("Не удалось скачать ведомость оценок");
      }
    };


    const importExcel = async (event) => {
      const file = event.target.files[0];

      if (!file) return;

      try {
        const token = localStorage.getItem("access_token");

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `http://127.0.0.1:8000/api/tests/${testId}/import-excel/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Ошибка импорта"
          );
        }

        alert("Импорт выполнен успешно");

        window.location.reload();

      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    };


  const setTaskResult = async (studentTestId, taskId, result) => {
    const student = studentTests.find((st) => st.id === studentTestId);
    const existing = student?.task_results?.find(
      (tr) => tr.task === taskId
    );

    let saved;

    if (existing) {
      saved = await apiPatch(`/task-results/${existing.id}/`, { result });
    } else {
      saved = await apiPost("/task-results/", {
        student_test: studentTestId,
        task: taskId,
        result,
      });
    }

    setStudentTests((prev) =>
      prev.map((st) =>
        st.id !== studentTestId
          ? st
          : {
              ...st,
              task_results: [
                ...(st.task_results || []).filter(
                  (tr) => tr.task !== taskId
                ),
                saved,
              ],
            }
      )
    );

    setEditingCell({ studentId: null, taskId: null });
  };

  if (!test) return <div className="loading">Загрузка...</div>;

  return (
    <div className="test-container">
            <div className="test-header">
        <div className="header-left">
          <button
            className="icon-button"
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/")
            }
          >
            ←
          </button>
          <button className="icon-button" onClick={() => navigate("/")}>
             <FiHome size={20} />
          </button>

          <div className="header-title">
            <h2>{test.title}</h2>
            <span className="subtitle">Заданий: {tasks.length}</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="secondary-button"
            onClick={() => setShowThresholdsModal(true)}
          >
            Пороги анализа
          </button>

        <button 
          onClick={exportToExcel} 
          className="secondary-button" 
        >
          Экспорт в Excel
        </button>

        <button
          className="secondary-button"
          onClick={() => document.getElementById("excel-import").click()}
        >
          Импорт из Excel
        </button>

        <input
          id="excel-import"
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={importExcel}
        />
          
          {activeTab === "results" && (
            <>
              <button
                className="primary-button"
                onClick={() => setShowTaskModal(true)}
              >
                + Задание
              </button>
              <button
                className="primary-button"
                onClick={() => setShowStudentModal(true)}
              >
                + Результат
              </button>
            </>
          )}
        </div>
      </div>


      <div className="tabs">
        <button
          className={activeTab === "results" ? "tab active" : "tab"}
          onClick={() => setActiveTab("results")}
        >
          Результаты
        </button>
        <button
          className={activeTab === "statistics" ? "tab active" : "tab"}
          onClick={() => setActiveTab("statistics")}
        >
          Статистика
        </button>
        <button
          className={activeTab === "recommendations" ? "tab active" : "tab"}
          onClick={() => setActiveTab("recommendations")}
        >
          Рекомендации
        </button>
      </div>

      {activeTab === "results" && (
        <table className="results-table" ref={tableRef}>
          <thead>
            <tr>
              <th>ФИО</th>
              {tasks.map((task) => (
                <th key={task.id}>
                  {task.topic}
                  <div className="task-hours">{task.hours} ч.</div>
                </th>
              ))}
              <th>Итог</th>
            </tr>
          </thead>
          <tbody>
            {studentTests.map((st) => (
              <tr key={st.id}>
                <td>{st.student_name}</td>

                {tasks.map((task) => {
                  const tr = st.task_results?.find(
                    (r) => r.task === task.id
                  );
                  const value = tr?.result || "—";
                  const isEditing =
                    editingCell.studentId === st.id &&
                    editingCell.taskId === task.id;

                  return (
                    <td
                      key={task.id}
                      className={
                        value === "Принято"
                          ? "accepted"
                          : value === "Частично принято"
                          ? "partial"
                          : value === "Не принято"
                          ? "rejected"
                          : "empty-cell"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCell({
                          studentId: st.id,
                          taskId: task.id,
                        });
                      }}
                    >
                      {isEditing ? (
                        <div className="cell-menu">
                          {["Принято", "Частично принято", "Не принято"].map(
                            (res) => (
                              <button
                                key={res}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskResult(st.id, task.id, res);
                                }}
                              >
                                {res}
                              </button>
                            )
                          )}
                        </div>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}

                <td>{st.final_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "statistics" && (
        <div className="statistics-container">
          {!statistics ? (
            <div className="loading">Загрузка статистики...</div>
          ) : (
          <>
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Задание</th>
                  <th>% успешного</th>
                  <th>% частичного</th>
                  <th>% неуспешного</th>
                  <th>Мат. ожидание</th>
                  <th>Дисперсия</th>
                  <th>Относ. сложность</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((s) => (
                  <tr key={s.task_id}>
                    <td>{s.task_topic}</td>
                    <td>{s.success_rate !== null ? `${(s.success_rate * 100).toFixed(1)}%` : "—"}</td>
                    <td>{s.uncertainty !== null ? `${(s.uncertainty * 100).toFixed(1)}%` : "—"}</td>
                    <td>{s.failure_rate !== null ? `${(s.failure_rate * 100).toFixed(1)}%` : "—"}</td>
                    <td>{s.mean_score !== null ? s.mean_score : "—"}</td>
                    <td>{s.variance !== null ? s.variance : "—"}</td>
                    <td>
                      {s.relative_difficulty !== null 
                        ? (s.relative_difficulty > 0 ? `+${s.relative_difficulty}` : s.relative_difficulty) 
                        : "—"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AnalyticsCharts statistics={statistics} />
          </>
          )}
        </div>
      )}


      {activeTab === "recommendations" && (
        <div className="recommendations-container">
          {!recommendations ? (
            <div className="loading">Загрузка рекомендаций...</div>
          ) : (
            recommendations.map((r) => (
              <div key={r.task_id} className="recommendation-card">
                <h3>{r.task_topic}</h3>
                <ul>
                  {r.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {showStudentModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowStudentModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить результат</h3>
            <form onSubmit={addStudentTest} className="modal-form">
              <input
                placeholder="ФИО студента"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Итоговая оценка"
                value={finalScore}
                onChange={(e) => setFinalScore(e.target.value)}
              />
              <button type="submit">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowTaskModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить задание</h3>
            <form onSubmit={addTask} className="modal-form">
              <input
                placeholder="Название задания"
                value={taskTopic}
                onChange={(e) => setTaskTopic(e.target.value)}
              />
              <input
                type="number"
                step="0.5"
                placeholder="Часы"
                value={taskHours}
                onChange={(e) => setTaskHours(e.target.value)}
              />
              <button type="submit">Создать</button>
            </form>
          </div>
        </div>
      )}
      {showThresholdsModal && (
        <Modal onClose={() => setShowThresholdsModal(false)}>
          <h3>Настройка порогов анализа</h3>
          <form onSubmit={updateThresholds} className="modal-form thresholds-form">
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", textAlign: "left" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Низкий средний балл (Мат. ожидание &lt;)</label>
              <input
                type="number" step="0.01" min="0" max="1"
                value={meanLow} onChange={(e) => setMeanLow(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", textAlign: "left" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Граница низкой вариативности (Дисперсия &lt;)</label>
              <input
                type="number" step="0.01" min="0" max="0.25"
                value={varianceLow} onChange={(e) => setVarianceLow(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", textAlign: "left" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Граница высокого разброса (Дисперсия &ge;)</label>
              <input
                type="number" step="0.01" min="0" max="0.25"
                value={varianceHigh} onChange={(e) => setVarianceHigh(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", textAlign: "left" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Высокая доля частичных решений (Неопределенность &gt;)</label>
              <input
                type="number" step="0.01" min="0" max="1"
                value={uncertaintyHigh} onChange={(e) => setUncertaintyHigh(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", textAlign: "left" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Успешное усвоение материала (Мат. ожидание &gt;)</label>
              <input
                type="number" step="0.01" min="0" max="1"
                value={successHigh} onChange={(e) => setSuccessHigh(e.target.value)}
              />
            </div>

            {/* НОВЫЕ ПОЛЯ ПОРОГОВЫХ ЗНАЧЕНИЙ */}
            <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px", textAlign: "left" }}>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: "500" }}>Критическая относительная сложность (Индекс &lt;)</label>
              <input
                type="number" step="0.01" min="-1" max="0"
                value={relativeDifficultyLow} onChange={(e) => setRelativeDifficultyLow(e.target.value)}
              />
            </div>
            <button type="submit" className="primary-button" style={{ width: "100%", marginTop: "10px" }}>Сохранить изменения</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>✖</span>
        {children}
      </div>
    </div>
  );
}