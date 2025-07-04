import axios, { AxiosProgressEvent } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes pour l'analyse des images
});

export interface AnalysisResult {
  hypothesis: string;
  confidence: number;
  observations: string[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  fullReport: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
}

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  type: string;
  file?: File;
}

export class MedGemmaService {
  /**
   * Analyser les images et le contexte clinique avec MedGemma
   */
  static async analyzeImages(
    images: UploadedImage[],
    clinicalContext: string,
    onProgress?: (progress: number) => void
  ): Promise<AnalysisResponse> {
    try {
      // Préparer FormData
      const formData = new FormData();
      
      // Ajouter le contexte clinique
      formData.append('clinicalContext', clinicalContext);
      
      // Convertir les images dataURL en File objects et les ajouter
      for (const image of images) {
        if (image.file) {
          // Si on a déjà un File object
          formData.append('images', image.file);
        } else if (image.url.startsWith('data:')) {
          // Convertir dataURL en File
          const file = await this.dataURLtoFile(image.url, image.name);
          formData.append('images', file);
        }
      }

      // Simuler le progrès pendant l'upload
      if (onProgress) {
        onProgress(10);
      }

      console.log('Envoi de la requête d\'analyse vers MedGemma...');
      console.log('Nombre d\'images:', images.length);
      console.log('Contexte clinique:', clinicalContext);

      const response = await apiClient.post<AnalysisResponse>('/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const uploadProgress = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            onProgress(10 + uploadProgress); // 10-60% pour l'upload
          }
        },
      });

      if (onProgress) {
        onProgress(100);
      }

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        return {
          success: false,
          error: `Erreur d'analyse: ${errorMessage}`
        };
      }
      
      return {
        success: false,
        error: `Erreur inconnue lors de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Tester la connexion avec le backend
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string; vertexAI: any }> {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      throw new Error('Impossible de se connecter au backend');
    }
  }

  /**
   * Test d'analyse sans images
   */
  static async testAnalysis(clinicalContext: string): Promise<AnalysisResponse> {
    try {
      const response = await apiClient.post<AnalysisResponse>('/api/test-analysis', {
        clinicalContext
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du test d\'analyse:', error);
      return {
        success: false,
        error: 'Erreur lors du test d\'analyse'
      };
    }
  }

  /**
   * Convertir une dataURL en File object
   */
  private static async dataURLtoFile(dataURL: string, filename: string): Promise<File> {
    const response = await fetch(dataURL);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * Valider le format d'image
   */
  static isValidImageFormat(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    return validTypes.includes(file.type);
  }

  /**
   * Valider la taille d'image
   */
  static isValidImageSize(file: File, maxSizeMB: number = 50): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }
}

export default MedGemmaService;
