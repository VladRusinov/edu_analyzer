import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiDelete, apiGet, apiPost } from "../api";
import "./SubjectsList.css";

export default function SubjectsList() {
  const [subjects, setSubjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/subjects/").then(setSubjects);
  }, []);

  async function addSubject(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const newSubject = await apiPost("/subjects/", { name, description });
    setSubjects((prev) => [...prev, newSubject]);
    setName("");
    setDescription("");
    setShowCreateModal(false);
  }

  async function deleteSubject() {
    try {
      await apiDelete(`/subjects/${subjectToDelete.id}/`);
      
      setSubjects((prev) =>
        prev.filter((s) => s.id !== subjectToDelete.id)
      );
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Не удалось удалить предмет:", err);
    }
  }

  return (
    <div className="subjects-page">
      <div className="subjects-header">
        <h1>Предметы</h1>
        <button
          className="primary-button"
          onClick={() => setShowCreateModal(true)}
        >
          + Создать предмет
        </button>
      </div>

      <div className="subjects-grid">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="subject-card"
            onClick={() => navigate(`/subjects/${sub.id}`)}
          >
            <div
              className="delete-icon"
              onClick={(e) => {
                e.stopPropagation();
                setSubjectToDelete(sub);
                setShowDeleteModal(true);
              }}
            >
              ✖
            </div>

            <h3>{sub.name}</h3>
            {sub.description && <p>{sub.description}</p>}
          </div>
        ))}

        {subjects.length === 0 && (
          <div className="empty-state">Пока нет предметов</div>
        )}
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <h3>Новый предмет</h3>
          <form onSubmit={addSubject} className="modal-form">
            <input
              placeholder="Название предмета"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit">Создать</button>
          </form>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <h3>Удалить предмет?</h3>
          <p>Вы уверены, что хотите удалить «{subjectToDelete.name}»?</p>
          <div className="modal-actions">
            <button
              className="danger-button"
              onClick={deleteSubject}
            >
              Удалить
            </button>
          </div>
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
