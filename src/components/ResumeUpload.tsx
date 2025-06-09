import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateStudentData } from '@/hooks/useStudentData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ResumeUploadProps {
  onUploadSuccess: (success: boolean) => void;
  hasExistingResume?: boolean;
}

const ResumeUpload = ({ onUploadSuccess, hasExistingResume = false }: ResumeUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const updateStudentData = useUpdateStudentData();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    
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

      // Update student record with resume URL
      await updateStudentData.mutateAsync({
        resume_url: data.publicUrl
      });

      // --- NEW: Call FastAPI to embed resume and update resume_embedding ---
      const formData = new FormData();
      formData.append('student_id', user.id);
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8000/embed-resume/', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Embedding failed.');
      }
      // --- END NEW ---
      
      setUploadStatus('success');
      onUploadSuccess(true);
      
      toast({
        title: "Upload Successful!",
        description: "Your resume has been uploaded, embedded, and is now available to recruiters."
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading or embedding your resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (uploadStatus === 'success' || hasExistingResume) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Resume Uploaded Successfully!</h3>
          <p className="text-sm text-gray-600 mt-1">
            Your resume is now visible to recruiters and included in search results.
          </p>
        </div>
        <div className="space-y-2">
          <Button variant="outline" onClick={resetUpload}>
            Upload New Resume
          </Button>
          <p className="text-xs text-gray-500">
            Uploading a new resume will replace your current one.
          </p>
        </div>
      </div>
    );
  }

  if (selectedFile && uploadStatus === 'idle') {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border">
          <FileText className="w-8 h-8 text-black" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-600">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetUpload}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={() => setShowUploadDialog(true)} className="flex-1">
            Update Resume
          </Button>
          <Button variant="outline" onClick={resetUpload}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (uploadStatus === 'uploading') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Upload className="w-8 h-8 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Uploading...</h3>
          <p className="text-sm text-gray-600">Please wait while we upload your resume.</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-black h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  if (uploadStatus === 'error') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Upload Failed</h3>
          <p className="text-sm text-gray-600">
            There was an error uploading your resume. Please try again.
          </p>
        </div>
        <Button onClick={resetUpload}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasExistingResume ? (
        <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">Resume Uploaded</h3>
          <p className="text-sm text-gray-500 dark:text-white-400 mb-4 transition-colors duration-300">
            Your resume is currently visible to recruiters
          </p>
          <Button
            variant="outline"
            onClick={() => setShowUploadDialog(true)}
            className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
          >
            Update Resume
          </Button>
        </div>
      ) : (
        <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">Upload Your Resume</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
            Upload your resume to get discovered by recruiters
          </p>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300"
          >
            Upload Resume
          </Button>
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white dark:bg-gray-800 transition-colors duration-300">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white transition-colors duration-300">
              {hasExistingResume ? 'Update Resume' : 'Upload Resume'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {hasExistingResume 
                ? 'Upload a new version of your resume to update your profile.'
                : 'Upload your resume to get discovered by recruiters.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume" className="text-gray-900 dark:text-white transition-colors duration-300">Resume File</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileInput}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 transition-colors duration-300"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                Accepted formats: PDF, DOC, DOCX (Max size: 5MB)
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeUpload;
