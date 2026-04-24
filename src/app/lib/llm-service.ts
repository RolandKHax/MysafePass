/**
 * LLM Service - Frontend interface for LLM API
 */

import { apiClient } from './api';

export interface PasswordAnalysis {
  overall_score: number;
  recommendation: string;
  approved: boolean;
  basic_analysis: {
    length: number;
    has_uppercase: boolean;
    has_lowercase: boolean;
    has_digits: boolean;
    has_special: boolean;
    has_spaces: boolean;
    consecutive_chars: string[];
    repeated_chars: number;
    keyboard_patterns: string[];
    common_patterns: string[];
    entropy_bits: number;
  };
  sensitive_data_detected: {
    detected_patterns: string[];
    is_risky: boolean;
    pattern_count: number;
  };
  password_length: number;
}

export interface LLMStatus {
  available: boolean;
  // Backwards-compat with single-LLM responses
  current_model?: string;
  available_models: string[];
  url: string;
  // New dual-LLM shape
  guard?: { available: boolean; model: string; role: string };
  generator?: { available: boolean; model: string; role: string };
}

export interface GeneratedPassword {
  success: boolean;
  password: string;
  length: number;
  entropy_bits: number;
  source: 'llm' | 'csprng';
  model: string;
  role: string;
}

export interface GeneratePasswordOptions {
  length?: number;
  include_lower?: boolean;
  include_upper?: boolean;
  include_digits?: boolean;
  include_symbols?: boolean;
}

export interface AIResponse {
  message: string;
  suggestions: string[];
  powered_by_llm?: boolean;
}

export interface AIContext {
  entries_count?: number;
  weak_entries?: Array<{ service: string; score: number }>;
  reused_count?: number;
  total_entries?: number;
  suspicious_entries?: Array<{ service: string; warning: string }>;
  entries?: Array<{ service: string; username: string }>;
}

export class LLMService {
  /**
   * Check password robustness and sensitive data injection
   */
  static async checkPassword(
    password: string,
    username?: string,
    email?: string
  ): Promise<PasswordAnalysis> {
    try {
      const response = await apiClient.request<{ success: boolean; analysis: PasswordAnalysis; error?: string }>(
        '/api/security/check-password',
        'POST',
        {
          password,
          username,
          email
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Password check failed');
      }

      return response.analysis;
    } catch (error) {
      console.error('Password check error:', error);
      throw error;
    }
  }

  /**
   * Get LLM status
   */
  static async getLLMStatus(): Promise<LLMStatus> {
    try {
      const response = await apiClient.request<LLMStatus>(
        '/api/ai/llm-status',
        'GET'
      );
      return response;
    } catch (error) {
      console.error('LLM status error:', error);
      return {
        available: false,
        current_model: 'unknown',
        available_models: [],
        url: 'http://localhost:11434'
      };
    }
  }

  /**
   * Send query to AI assistant
   */
  static async chat(
    query: string,
    context?: AIContext,
    useLLM: boolean = true
  ): Promise<AIResponse> {
    try {
      const response = await apiClient.request<{ success: boolean; response: AIResponse; error?: string }>(
        '/api/ai/chat',
        'POST',
        {
          query,
          context,
          use_llm: useLLM
        }
      );

      if (!response.success) {
        throw new Error(response.error || 'Chat failed');
      }

      return response.response;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }

  /**
   * Generate a strong password using the dedicated generator LLM
   * (with deterministic CSPRNG fallback on the backend).
   */
  static async generatePassword(options: GeneratePasswordOptions = {}): Promise<GeneratedPassword> {
    const response = await apiClient.request<GeneratedPassword & { error?: string }>(
      '/api/ai/generate-password',
      'POST',
      {
        length: options.length ?? 20,
        include_lower: options.include_lower ?? true,
        include_upper: options.include_upper ?? true,
        include_digits: options.include_digits ?? true,
        include_symbols: options.include_symbols ?? true,
      }
    );
    if (!response.success) {
      throw new Error(response.error || 'Génération échouée');
    }
    return response;
  }
}

export default LLMService;
