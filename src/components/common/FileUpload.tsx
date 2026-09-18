import { useState, useRef } from 'react';

interface Props {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  preview?: boolean;
}

export default function FileUpload({ onFileSelect, accept = '*', label = 'Загрузить файл', preview = false }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    onFileSelect(file);
    if (preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        dragOver
          ? 'border-purple-500 bg-purple-500/10'
          : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
      ) : (
        <div className="text-3xl mb-2">📁</div>
      )}
      <p className="text-sm text-purple-200/70">{label}</p>
      <p className="text-xs text-purple-300/40 mt-1">Перетащите или нажмите для выбора</p>
    </div>
  );
}
