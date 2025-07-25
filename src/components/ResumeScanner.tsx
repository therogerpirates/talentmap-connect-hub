import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, X, AlertCircle, Scan, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface ResumeScannerProps {
  onScanComplete: (parsedData: any) => void;
  hasExistingResume?: boolean;
}

const ResumeScanner = ({ onScanComplete, hasExistingResume = false }: ResumeScannerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'uploading' | 'scanning' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const updateStudentData = useUpdateStudentData();
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelection(files);
  };

  const handleFileSelection = (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleScanResume = async () => {
    if (!selectedFile || !user) return;

    setScanStatus('uploading');
    const progressInterval = simulateProgress();
    
    try {
      // Create unique filename
      const fileExt = selectedFile.name.split('.')?.pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setScanStatus('scanning');
      setProgress(95);

      // Call FastAPI to embed resume and parse data
      const formData = new FormData();
      formData.append('student_id', user.id);
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/embed-resume/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Scanning failed.');
      }

      const result = await response.json();
      
      // Mock parsed data for demo (replace with actual API response)
      const mockParsedData = {
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        experience: 'Software Developer Intern at Tech Corp (6 months) - Developed web applications using React and Node.js',
        cgpa: '8.5',
        tenth_percentage: '95.2',
        twelfth_percentage: '92.8',
        projects: [
          {
            title: 'E-commerce Website',
            description: 'Built a full-stack e-commerce platform using React, Node.js, and MongoDB'
          },
          {
            title: 'Task Management App',
            description: 'Developed a task management application with real-time updates using Socket.io'
          }
        ]
      };

      // Update student record with resume URL
      await updateStudentData.mutateAsync({
        resume_url: data.publicUrl
      });

      setProgress(100);
      setParsedData(mockParsedData);
      setScanStatus('success');
      onScanComplete(mockParsedData);
      
      toast({
        title: "Resume Scanned Successfully!",
        description: "Your resume has been analyzed and your profile has been updated with the extracted information."
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      setScanStatus('error');
      toast({
        title: "Scan Failed",
        description: error.message || "There was an error scanning your resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setScanStatus('idle');
    setParsedData(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (scanStatus === 'success' && parsedData) {
    return (
      <Card className="glass-card border-glass">
        <CardContent className="text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto animate-scale-in">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Resume Scanned Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              We've extracted key information from your resume and populated your profile.
            </p>
          </div>
          <div className="space-y-2">
            <Button variant="outline" onClick={resetScanner} className="glass-button">
              Scan New Resume
            </Button>
            <p className="text-xs text-muted-foreground">
              You can edit the extracted information in the form below.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanStatus === 'uploading' || scanStatus === 'scanning') {
    return (
      <Card className="glass-card border-glass">
        <CardContent className="text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Scan className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {scanStatus === 'uploading' ? 'Uploading Resume...' : 'Analyzing Resume...'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {scanStatus === 'uploading' 
                ? 'Please wait while we upload your resume.' 
                : 'AI is extracting information from your resume.'}
            </p>
          </div>
          <div className="w-full space-y-2">
            <Progress value={progress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scanStatus === 'error') {
    return (
      <Card className="glass-card border-glass">
        <CardContent className="text-center space-y-4 p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-destructive/20 to-destructive/30 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Scan Failed</h3>
            <p className="text-sm text-muted-foreground">
              There was an error scanning your resume. Please try again.
            </p>
          </div>
          <Button onClick={resetScanner} className="glass-button">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground/90">
          <Scan className="w-5 h-5" />
          <span>Resume Scanner</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {hasExistingResume ? (
          <div className="text-center p-6 border-2 border-dashed border-glass rounded-lg bg-glass-fill/30">
            <FileText className="w-12 h-12 text-accent-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Resume Uploaded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your resume is currently visible to recruiters
            </p>
            <Button
              onClick={() => setShowScanDialog(true)}
              className="glass-button"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan New Resume
            </Button>
          </div>
        ) : (
          <div 
            className={`text-center p-6 border-2 border-dashed rounded-lg transition-all duration-300 ${
              isDragging 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-glass bg-glass-fill/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-accent-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Scan Your Resume</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume and let AI extract your information automatically
            </p>
            <Button
              onClick={() => setShowScanDialog(true)}
              className="glass-button"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan Resume
            </Button>
          </div>
        )}

        <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
          <DialogContent className="glass-modal">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {hasExistingResume ? 'Scan New Resume' : 'Scan Resume'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {hasExistingResume 
                  ? 'Upload a new resume to automatically extract and update your information.'
                  : 'Upload your resume and let AI automatically extract your skills, experience, and other details.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-foreground">Resume File</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="glass-input"
                />
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF only (Max size: 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center space-x-3 p-3 glass-card border-glass rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowScanDialog(false)}
                  className="glass-button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScanResume}
                  disabled={!selectedFile}
                  className="glass-button"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Scan Resume
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ResumeScanner;