import { useEffect, useState, CSSProperties } from 'react';
import api from '../../services/api';
import { User } from 'lucide-react';

interface Props {
  imageKey: string | null | undefined;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

export const PrivateImage = ({ imageKey, alt, className, style }: Props) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!imageKey) return;

      if (imageKey.startsWith('http') || imageKey.startsWith('/uploads') || imageKey.startsWith('blob:')) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        const finalUrl = imageKey.startsWith('http') || imageKey.startsWith('blob:')
          ? imageKey
          : `${cleanBaseUrl}${imageKey}`;
        setUrl(finalUrl);
        return;
      }

      try {
        const { data } = await api.get(`/storage/view-url?key=${imageKey}`);
        setUrl(data.url);
      } catch (err) {
        console.error('Error obteniendo la imagen', err);
        setError(true);
      }
    };

    fetchUrl();
  }, [imageKey]);

  if (!imageKey || error) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`} style={style}>
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  if (!url) {
    return <div className={`animate-pulse bg-gray-200 ${className}`} style={style}></div>;
  }

  return <img src={url} alt={alt} className={className} style={style} />;
};