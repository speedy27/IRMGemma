export interface TextPrompt {
  text: string;
}

export interface GenerateResponse {
  response: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  static async generateText(prompt: string): Promise<GenerateResponse> {
    const response = await fetch(`${API_BASE_URL}/generate-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: prompt }),
    });

    return this.handleResponse<GenerateResponse>(response);
  }

  static async generateWithImage(prompt: string, image: File): Promise<GenerateResponse> {
    const formData = new FormData();
    formData.append('prompt', JSON.stringify({ text: prompt }));
    formData.append('image', image);

    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<GenerateResponse>(response);
  }

  static async generate(prompt: string, image?: File): Promise<GenerateResponse> {
    if (image) {
      return this.generateWithImage(prompt, image);
    }
    return this.generateText(prompt);
  }
}