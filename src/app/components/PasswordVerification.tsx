import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { LLMService, PasswordAnalysis } from '@/app/lib/llm-service';

interface PasswordVerificationProps {
  password: string;
  username?: string;
  email?: string;
  onAnalysisComplete?: (analysis: PasswordAnalysis) => void;
  showDetailedAnalysis?: boolean;
}

export function PasswordVerification({
  password,
  username,
  email,
  onAnalysisComplete,
  showDetailedAnalysis = true,
}: PasswordVerificationProps) {
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!password || password.length < 3) {
      setAnalysis(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await LLMService.checkPassword(password, username, email);
        setAnalysis(result);
        onAnalysisComplete?.(result);
      } catch (err) {
        console.error('Password verification error:', err);
        setError('Erreur lors de la vérification du mot de passe');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [password, username, email, onAnalysisComplete]);

  if (!password || password.length < 3) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader className="size-4 animate-spin" />
        Vérification en cours...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      {/* Score Bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Score de robustesse</span>
          <span className={`text-sm font-bold ${getScoreColor(analysis.overall_score)}`}>
            {analysis.overall_score}/100
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              analysis.overall_score >= 80
                ? 'bg-green-500'
                : analysis.overall_score >= 60
                ? 'bg-yellow-500'
                : analysis.overall_score >= 40
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${analysis.overall_score}%` }}
          />
        </div>
      </div>

      {/* Approval Status */}
      <div
        className={`flex items-center gap-2 p-2 rounded text-sm ${
          analysis.approved
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}
      >
        {analysis.approved ? (
          <Check className="size-4" />
        ) : (
          <AlertCircle className="size-4" />
        )}
        {analysis.approved ? (
          <span>Mot de passe approuvé</span>
        ) : (
          <span>Mot de passe non approuvé</span>
        )}
      </div>

      {/* Recommendation */}
      {analysis.recommendation && (
        <div className="text-sm p-2 bg-blue-50 text-blue-800 rounded border border-blue-200">
          <p className="font-medium mb-1">Recommandation</p>
          <p>{analysis.recommendation}</p>
        </div>
      )}

      {/* Sensitive Data Warning */}
      {analysis.sensitive_data_detected?.is_risky && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Données sensibles détectées</AlertTitle>
          <AlertDescription>
            Le mot de passe contient {analysis.sensitive_data_detected.pattern_count} motif(s) suspect(s) :
            <ul className="mt-2 ml-4 list-disc">
              {analysis.sensitive_data_detected.detected_patterns.map((pattern) => (
                <li key={pattern} className="text-sm">
                  {pattern.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Analysis */}
      {showDetailedAnalysis && analysis.basic_analysis && (
        <details className="text-sm cursor-pointer">
          <summary className="font-medium p-2 hover:bg-gray-100 rounded">
            Voir l'analyse détaillée
          </summary>
          <div className="mt-2 space-y-1 text-xs text-gray-600 p-2 bg-gray-50 rounded">
            <p>Longueur: {analysis.password_length}</p>
            <p>
              Caractères:
              {['majuscules', analysis.basic_analysis.has_uppercase].filter(Boolean).length > 0 && ' Maj'}
              {analysis.basic_analysis.has_lowercase && ' min'}
              {analysis.basic_analysis.has_digits && ' Chiffres'}
              {analysis.basic_analysis.has_special && ' Spéciaux'}
            </p>
            <p>Entropie: {analysis.basic_analysis.entropy_bits.toFixed(1)} bits</p>
            {analysis.basic_analysis.keyboard_patterns.length > 0 && (
              <p className="text-red-600">
                Motifs clavier détectés: {analysis.basic_analysis.keyboard_patterns.join(', ')}
              </p>
            )}
            {analysis.basic_analysis.consecutive_chars.length > 0 && (
              <p className="text-yellow-600">
                Caractères consécutifs: {analysis.basic_analysis.consecutive_chars.join(', ')}
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default PasswordVerification;
