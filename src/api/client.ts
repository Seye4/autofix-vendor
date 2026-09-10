import axios from 'axios';
import { API_KEY, getToken } from '@/storage/authStorage';

type RequestOptions = {
  method?: string;
  body?: any;
  token?: string | null;
  isFormData?: boolean;
};

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const token = options.token ?? (await getToken());
  const headers: Record<string, string> = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let formattedBody: any;
  if (isFormData) {
    formattedBody = body;
  } else if (body !== undefined) {
    // If it's already a string, send as-is; otherwise stringify
    formattedBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response: Response;

  try {
    response = await fetch(`${API_KEY}/${endpoint}`, {
      method,
      headers,
      body: formattedBody,
    });
  } catch (error) {
    throw new Error('Unable to connect to the server. Please check your internet connection.');
  }

  const responseText = await response.text();

  console.log('=================================');
  console.log('API RESPONSE');
  console.log('Endpoint:', endpoint);
  console.log('HTTP Status:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));
  console.log('Response:', responseText);
  console.log('=================================');

  let result: any;

  try {
    result = JSON.parse(responseText);
  } catch (error) {
    console.error('JSON PARSE ERROR:', error);

    throw new Error(
      `Server returned invalid JSON. HTTP ${response.status}. Response: ${responseText.substring(
        0,
        500
      )}`
    );
  }

  if (!response.ok) {
    console.error(`[API Error ${response.status}] Endpoint: ${endpoint}`, result);

    let errorMessage = `Request failed (${response.status}).`;

    if (result) {
      if (typeof result.message === 'string') {
        errorMessage = result.message;
      } else if (typeof result.message === 'object' && result.message !== null) {
        errorMessage = JSON.stringify(result.message);
      } else if (result.error && typeof result.error === 'string') {
        errorMessage = result.error;
      } else if (Array.isArray(result.errors)) {
        errorMessage = result.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
      }
    }

    throw new Error(errorMessage);
  }

  return result as T;
}
