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

  const handleUpload = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!selectedFile || !user) return;

    setIsUploading(true);
    setShowUploadDialog(false); // Close dialog when upload starts

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

      // --- NEW: Call FastAPI to embed resume and extract data for resume builder ---
      const formData = new FormData();
      formData.append('student_id', user.id);
      formData.append('file', selectedFile);

      // First, extract resume for builder
      const extractResponse = await fetch('http://localhost:8000/extract-resume-for-builder/', {
        method: 'POST',
        body: formData
      });

      if (!extractResponse.ok) {
        console.warn('Resume extraction for builder failed, continuing with embedding...');
      } else {
        const extractData = await extractResponse.json();
        console.log('✅ Resume extracted for builder:', extractData);
        toast({
          title: "Resume Extracted!",
          description: `Found ${extractData.extraction_stats?.skills_found || 0} skills, ${extractData.extraction_stats?.projects_found || 0} projects`,
        });
      }

      // Then, embed resume for matching
      const formData2 = new FormData();
      formData2.append('student_id', user.id);
      formData2.append('file', selectedFile);

      const embedResponse = await fetch('http://localhost:8000/embed-resume/', {
        method: 'POST',
        body: formData2
      });

      if (!embedResponse.ok) {
        const errorData = await embedResponse.json().catch(() => ({}));
        console.error('Embedding failed:', errorData);
        throw new Error(errorData.detail || 'Resume analysis failed. Please try again.');
      }
      // --- END NEW ---

      setUploadStatus('success');
      onUploadSuccess(true);

      toast({
        title: "Upload Successful!",
        description: "Your resume has been uploaded and is being analyzed. Please wait for the analysis to complete."
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
    setShowUploadDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Comment out the original success state that blocks re-upload
  // if (uploadStatus === 'success' || hasExistingResume) {
  //   return (
  //     <div className="text-center space-y-4">
  //       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
  //         <CheckCircle className="w-8 h-8 text-green-600" />
  //       </div>
  //       <div>
  //         <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Resume Uploaded Successfully!</h3>
  //         <p className="text-sm text-gray-600 mt-1">
  //           Your resume is now visible to recruiters and included in search results.
  //         </p>
  //       </div>
  //       <div className="space-y-2">
  //         <Button variant="outline" onClick={resetUpload}>
  //           Upload New Resume
  //         </Button>
  //         <p className="text-xs text-gray-500">
  //           Uploading a new resume will replace your current one.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  // New improved success state that shows upload success but allows re-upload
  if (uploadStatus === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white transition-colors duration-300">Resume Uploaded Successfully!</h3>
          <p className="text-sm text-gray-600 mt-1">
            Your resume has been processed and analyzed. All fields have been updated.
          </p>
        </div>
        <div className="space-y-2">
          <Button variant="outline" onClick={resetUpload}>
            Upload Another Resume
          </Button>
          <p className="text-xs text-gray-500">
            Upload a new resume to update your profile and re-analyze your information.
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
          <Button onClick={handleUpload} className="flex-1" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Resume'}
          </Button>
          <Button variant="outline" onClick={resetUpload}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (uploadStatus === 'uploading' || isUploading) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Upload className="w-8 h-8 text-primary animate-bounce" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Uploading & Processing...</h3>
          <p className="text-sm text-gray-600">Please wait while we upload and analyze your resume.</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
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
    <div className="h-full">
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white dark:bg-slate-800 sm:max-w-md transition-all">
          <DialogHeader>
            <DialogTitle>{hasExistingResume ? 'Update Resume' : 'Upload Resume'}</DialogTitle>
            <DialogDescription>
              Choose a PDF file to update your profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); if (selectedFile) handleUpload(e); }} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-600 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">PDF (MAX. 10MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
              {selectedFile && (
                <div className="flex items-center p-2 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="ml-2 opacity-70">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Display Area matching the Wireframe */}
      <div className="h-full min-h-[400px] flex items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900/50 text-center">

        {/* Uploading State */}
        {(uploadStatus === 'uploading' || isUploading) && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Uploading...</h3>
              <p className="text-slate-500"> analyzing your resume</p>
            </div>
          </div>
        )}

        {/* Success / Preview State (Temporary) */}
        {uploadStatus === 'success' && !isUploading && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Analysis Complete!</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Your profile has been updated with the extracted information.</p>
            </div>
          </div>
        )}

        {/* Idle / Existing Resume State */}
        {uploadStatus === 'idle' && !isUploading && (
          <div className="space-y-6 max-w-md mx-auto">
            {hasExistingResume ? (
              <>
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Resume Uploaded</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Your resume is currently visible to recruiters
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => setShowUploadDialog(true)}
                >
                  Update Resume
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-200 transition-colors">
                  <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Your Resume</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Upload (PDF) to extract skills and get AI insights
                  </p>
                </div>
                <Button
                  className="mt-4 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  onClick={() => setShowUploadDialog(true)}
                >
                  Select File
                </Button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ResumeUpload;
