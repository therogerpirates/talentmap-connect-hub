
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    if (!selectedFile) return;

    setUploadStatus('uploading');
    
    // Simulate upload process
    try {
      // Here you would integrate with Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadStatus('success');
      onUploadSuccess(true);
      
      toast({
        title: "Upload Successful!",
        description: "Your resume has been uploaded and is now available to recruiters."
      });
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your resume. Please try again.",
        variant: "destructive"
      });
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
          <h3 className="text-lg font-medium text-gray-900">Resume Uploaded Successfully!</h3>
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
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border">
          <FileText className="w-8 h-8 text-blue-600" />
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
          <Button onClick={handleUpload} className="flex-1">
            Upload Resume
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Uploading...</h3>
          <p className="text-sm text-gray-600">Please wait while we upload your resume.</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
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
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isDragging ? 'Drop your resume here' : 'Upload your resume'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Drag & drop your PDF file here, or click to browse
            </p>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported format: PDF only</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
      />
      
      <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
        Choose File
      </Button>
    </div>
  );
};

export default ResumeUpload;
