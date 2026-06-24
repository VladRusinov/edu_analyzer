import { useEffect, useState } from "react";
import { FiCalendar, FiFileText, FiHome } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPatch, apiPost } from "../api";
import "./SubjectDetails.css";

export default function SubjectDetails() {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [tests, setTests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const [activeTab, setActiveTab] = useState("tests");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState("");
  const [showThresholdModal, setShowThresholdModal] =
  useState(false);

  const [thresholds, setThresholds] = useState({
    threshold_mean_low: 0,
    threshold_variance_low: 0,
    threshold_variance_high: 0,
    threshold_success_high: 0,
    threshold_relative_difficulty_low: 0,
    threshold_relative_difficulty_high: 0,
  });

  useEffect(() => {
    apiGet(`/subjects/${subjectId}/`).then((data) => {
      setSubject(data);

      setThresholds({
        threshold_mean_low:
          data.threshold_mean_low,
        threshold_variance_low:
          data.threshold_variance_low,
        threshold_variance_high:
          data.threshold_variance_high,
        threshold_success_high:
          data.threshold_success_high,
        threshold_relative_difficulty_low:
          data.threshold_relative_difficulty_low,
        threshold_relative_difficulty_high:
          data.threshold_relative_difficulty_high,
      });
    });

    apiGet(`/tests/?subject=${subjectId}`).then(setTests);

    apiGet(`/subjects/${subjectId}/statistics/`)
      .then(setStatistics);

    apiGet(`/subjects/${subjectId}/recommendations/`)
      .then(setRecommendations);

  }, [subjectId]);

  const saveThresholds = async (e) => {
    e.preventDefault();

    const updatedSubject = await apiPatch(
      `/subjects/${subjectId}/`,
      thresholds
    );

    setSubject(updatedSubject);

    await Promise.all([
      apiGet(`/subjects/${subjectId}/statistics/`)
        .then(setStatistics),

      apiGet(`/subjects/${subjectId}/recommendations/`)
        .then(setRecommendations),
    ]);

    setShowThresholdModal(false);
  };

  const createTest = async (e) => {
    e.preventDefault();

    if (!newTestTitle.trim()) return;

    const newTest = await apiPost("/tests/", {
      title: newTestTitle,
      subject: subjectId,
    });

    setTests((prev) => [...prev, newTest]);
    setNewTestTitle("");
    setShowCreateModal(false);
  };

  if (!subject) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="subject-container">
      <div className="subject-header">
        <div className="header-left">
          <button
            className="nav-button"
            onClick={() =>
              window.history.length > 1
                ? navigate(-1)
                : navigate("/")
            }
          >
            ← Назад
          </button>

          <button
            className="nav-button"
            onClick={() => navigate("/")}
          >
            <FiHome size={20} />
          </button>
        </div>

        <h2 className="subject-title">{subject.name}</h2>

        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => setShowThresholdModal(true)}
          >
            Пороги
          </button>

          <button
            className="primary-button"
            onClick={() => setShowCreateModal(true)}
          >
            + Создать контрольную
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={
            activeTab === "tests"
              ? "tab active"
              : "tab"
          }
          onClick={() => setActiveTab("tests")}
        >
          Контрольные
        </button>

        <button
          className={
            activeTab === "statistics"
              ? "tab active"
              : "tab"
          }
          onClick={() => setActiveTab("statistics")}
        >
          Статистика
        </button>

        <button
          className={
            activeTab === "recommendations"
              ? "tab active"
              : "tab"
          }
          onClick={() =>
            setActiveTab("recommendations")
          }
        >
          Рекомендации
        </button>
      </div>

      {activeTab === "tests" && (
        <div className="tests-list">
          {tests.map((test) => (
            <div
              key={test.id}
              className="test-card"
              onClick={() =>
                navigate(`/tests/${test.id}`)
              }
            >
              <h3>{test.title}</h3>

              <div className="test-meta">
                <span>
                  <FiCalendar />{" "}
                  {new Date(
                    test.created_at
                  ).toLocaleDateString()}
                </span>

                <span>
                  <FiFileText /> Заданий:{" "}
                  {test.num_tasks}
                </span>
              </div>
            </div>
          ))}

          {tests.length === 0 && (
            <p className="empty-text">
              Пока нет контрольных работ
            </p>
          )}
        </div>
      )}

      {activeTab === "statistics" &&
        statistics && (
          <div className="statistics-section">
            <div className="statistics-summary">
              <h3>
                Средний балл по всем
                контрольным:{" "}
                {statistics.mean_score_all_tests}
              </h3>
            </div>

            <div className="statistics-list">
              {statistics.statistics.map(
                (test) => (
                  <div
                    key={test.test_id}
                    className="statistics-card"
                  >
                    <h3>{test.test_title}</h3>

                    <div className="statistics-grid">
                      <div>
                        <span>
                          Средний балл
                        </span>
                        <strong>
                          {test.mean_score}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Медианный балл
                        </span>
                        <strong>
                          {test.median_score}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Дисперсия
                        </span>
                        <strong>
                          {test.variance}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Относительная
                          сложность
                        </span>
                        <strong>
                          {
                            test.relative_difficulty
                          }
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {activeTab === "recommendations" &&
        recommendations && (
          <div className="recommendations-section">
            {recommendations.recommendations.map(
              (test) => (
                <div
                  key={test.test_id}
                  className="recommendation-card"
                >
                  <h3>{test.test_title}</h3>

                  <div className="recommendation-metrics">
                    <span>
                      Средний балл:{" "}
                      {test.mean_score}
                    </span>

                    <span>
                      Медиана:{" "}
                      {test.median_score}
                    </span>

                    <span>
                      Дисперсия:{" "}
                      {test.variance}
                    </span>

                    <span>
                      Относительная
                      сложность:{" "}
                      {
                        test.relative_difficulty
                      }
                    </span>
                  </div>

                  <div className="recommendation-list">
                    {test.recommendations.map(
                      (
                        recommendation,
                        index
                      ) => (
                        <div
                          key={index}
                          className="recommendation-item"
                        >
                          {recommendation}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowCreateModal(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <h3>Новая контрольная</h3>

              <span
                className="close-modal"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ✖
              </span>
            </div>

            <form
              onSubmit={createTest}
              className="modal-form"
            >
              <input
                placeholder="Название контрольной"
                value={newTestTitle}
                onChange={(e) =>
                  setNewTestTitle(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                className="primary-button"
              >
                Создать
              </button>
            </form>
          </div>
        </div>
      )}
      {showThresholdModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowThresholdModal(false)
          }
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <h3>Пороговые значения</h3>

              <span
                className="close-modal"
                onClick={() =>
                  setShowThresholdModal(false)
                }
              >
                ✖
              </span>
            </div>

            <form
              onSubmit={saveThresholds}
              className="modal-form"
            >
              <label>
                Низкий средний балл
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  thresholds.threshold_mean_low
                }
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    threshold_mean_low:
                      Number(e.target.value),
                  })
                }
              />

              <label>
                Низкая дисперсия
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  thresholds.threshold_variance_low
                }
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    threshold_variance_low:
                      Number(e.target.value),
                  })
                }
              />

              <label>
                Высокая дисперсия
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  thresholds.threshold_variance_high
                }
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    threshold_variance_high:
                      Number(e.target.value),
                  })
                }
              />

              <label>
                Высокий средний балл
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  thresholds.threshold_success_high
                }
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    threshold_success_high:
                      Number(e.target.value),
                  })
                }
              />

              <label>
                Нижняя граница относительной сложности
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  thresholds.threshold_relative_difficulty_low
                }
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    threshold_relative_difficulty_low:
                      Number(e.target.value),
                  })
                }
              />

              <label>
                Верхняя граница относительной сложности
              </label>
              <input
                type="number"
                step="0.1"
                value={
                  thresholds.threshold_relative_difficulty_high
                }
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    threshold_relative_difficulty_high:
                      Number(e.target.value),
                  })
                }
              />

              <button
                type="submit"
                className="primary-button"
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}