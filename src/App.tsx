import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NewRegister from "./pages/NewRegister";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import StudentDashboard from "./pages/StudentDashboard";
import ResumeScanner from "./pages/ResumeScanner";
import StudentDetails from "./pages/StudentDetails";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ProfilePage from './pages/ProfilePage';
import AdminStudentDetail from './pages/AdminStudentDetail';
import CreateSession from './pages/CreateSession';
import SessionDetail from './pages/SessionDetail';
import ResumeBuilder from './pages/ResumeBuilder';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/new-register" element={<NewRegister />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/student-dashboard" 
                element={
                  <ProtectedRoute role="student">
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resume-scanner" 
                element={
                  <ProtectedRoute role="student">
                    <ResumeScanner />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/student-details" 
                element={
                  <ProtectedRoute role="student">
                    <StudentDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/profile" element={<ProfilePage />} />
              <Route 
                path="/admin/students/:studentId" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminStudentDetail />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/create-session" 
                element={
                  <ProtectedRoute role="admin">
                    <CreateSession />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/sessions/:sessionId" 
                element={
                  <ProtectedRoute role="admin">
                    <SessionDetail />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/resume-builder" 
                element={
                  <ProtectedRoute role="student">
                    <ResumeBuilder />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
