import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SubjectDetails from "./pages/SubjectDetails";
import SubjectsList from "./pages/SubjectsList";
import TestDetails from "./pages/TestDetails";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <SubjectsList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subjects/:subjectId" 
          element={
            <ProtectedRoute>
              <SubjectDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tests/:testId" 
          element={
            <ProtectedRoute>
              <TestDetails />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
