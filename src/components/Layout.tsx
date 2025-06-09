import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors duration-300">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center transition-colors duration-300">
              <BookOpen className="w-5 h-5 text-white dark:text-black transition-colors duration-300" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">TalentMap</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="transition-colors duration-300">Login</Button>
            </Link>
            <Link to="/new-register">
              <Button className="transition-colors duration-300">Get Started</Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
} 