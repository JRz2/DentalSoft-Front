import { useEffect, useState } from 'react';
import api from '../../services/api';

interface Props {
  imageKey: string;
  alt: string;
  className?: string;
}

export const PrivateImage = ({ imageKey, alt, className }: Props) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const { data } = await api.get(`/storage/view-url?key=${imageKey}`);
        setUrl(data.url);
      } catch (error) {
        console.error('Error obteniendo la imagen', error);
      }
    };

    if (imageKey) fetchUrl();
  }, [imageKey]);

  if (!url) {
    return <div className="animate-pulse bg-gray-200 w-10 h-10 rounded-full"></div>;
  }

  return <img src={url} alt={alt} className={className} />;
};