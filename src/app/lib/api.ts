/**
 * API Client for MySafePass Backend
 * Handles communication with the Python backend
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || '')
  .replace(/\/$/, '')
  .replace(/\/api$/, '');

export interface RegisterRequest extends Record<string, unknown> {
  // Email is OPTIONAL (RGPD minimisation).
  username: string;
  email?: string;
  password: string;
}

export interface LoginRequest extends Record<string, unknown> {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user_id?: number;
  username?: string;
  email?: string;
  token?: string;
  encryption_salt?: string;
  error?: string;
}

export interface VaultEntry {
  id: number;
  service: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  tags: string[];
  notes?: string;
  password_score: number;
  entropy_bits: number;
  crack_time_label: string;
  password_warnings: string[];
  domain_warnings: string[];
}

export interface VaultEntryRequest extends Record<string, unknown> {
  service: string;
  username: string;
  password: string;
  url?: string;
  category?: string;
  tags?: string[];
  notes?: string;
}

class ApiClient {
  private token: string | null = null;
  private userId: number | null = null;

  setAuth(token: string, userId: number) {
    this.token = token;
    this.userId = userId;
  }

  clearAuth() {
    this.token = null;
    this.userId = null;
  }

  public async request<T>(
    endpoint: string,
    method: string = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.token) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify({ ...body });
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data as T;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', 'POST', data);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', 'POST', data);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/change-password', 'POST', {
      user_id: userId,
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  async getVaultEntries(): Promise<VaultEntry[]> {
    const response = await this.request<{ entries: VaultEntry[] }>(
      `/api/vault/entries?user_id=${this.userId}`
    );
    return response.entries;
  }

  async addVaultEntry(data: VaultEntryRequest): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/vault/entries?user_id=${this.userId}`,
      'POST',
      data
    );
  }

  async healthCheck(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/api/health');
  }

  async getVersion(): Promise<{ version: string; name: string }> {
    return this.request<{ version: string; name: string }>('/api/version');
  }
}

export const apiClient = new ApiClient();
