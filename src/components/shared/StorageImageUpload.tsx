import { useState } from 'react';
import api from '../../services/api';

interface Props {
  folder: string; // Ej: 'pacientes', 'usuarios'
  onUploadSuccess: (key: string) => void; // Callback para guardar el key en la DB
}

export const StorageImageUpload = ({ folder, onUploadSuccess }: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null); 

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Crear una URL temporal local para mostrar la vista previa
    const localPreviewUrl = URL.createObjectURL(file);
    setPreview(localPreviewUrl);

    try {
      setIsUploading(true);

      // 2. Pedir URL prefirmada al backend
      const { data } = await api.post('/storage/upload-url', {
        folder: folder,
        contentType: file.type,
      });

      // 3. Subir el archivo directamente a Backblaze con un PUT
      const response = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) throw new Error('Error subiendo a Backblaze');

      // 4. Notificar al componente padre que guarde el "key" en la DB
      onUploadSuccess(data.key);
      
    } catch (error) {
      console.error(error);
      alert('Error al subir la imagen');
      setPreview(null); // Si falla, quitamos la vista previa
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mostrar la previsualización si existe */}
      {preview && (
        <img 
          src={preview} 
          alt="Vista previa" 
          className="w-24 h-24 object-cover rounded-full border-2 border-blue-500 shadow-sm" 
        />
      )}

      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        disabled={isUploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {isUploading && (
        <p className="text-blue-500 text-sm animate-pulse">Subiendo imagen...</p>
      )}
    </div>
  );
};