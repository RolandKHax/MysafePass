import { useEffect, useState } from 'react';
import { Loader, AlertCircle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { LLMService, LLMStatus } from '@/app/lib/llm-service';

export function LLMStatusIndicator() {
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const llmStatus = await LLMService.getLLMStatus();
        setStatus(llmStatus);
      } catch (error) {
        console.error('Error checking LLM status:', error);
        setStatus({
          available: false,
          current_model: 'unknown',
          available_models: [],
          url: 'http://localhost:11434',
        });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader className="size-3 animate-spin" />
        Vérification LLM...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <AlertCircle className="size-3" />
        Impossible de vérifier le statut
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
          {status.available ? (
            <>
              <Check className="size-3 text-green-600" />
              <span className="text-xs text-green-600">LLM Actif</span>
            </>
          ) : (
            <>
              <AlertCircle className="size-3 text-orange-600" />
              <span className="text-xs text-orange-600">LLM Inactif</span>
            </>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Statut du LLM Local</DialogTitle>
          <DialogDescription>
            Information sur le modèle d'intelligence artificielle local
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
            {status.available ? (
              <Check className="size-5 text-green-600" />
            ) : (
              <AlertCircle className="size-5 text-orange-600" />
            )}
            <div>
              <p className="font-medium text-sm">
                {status.available ? 'LLM Connecté' : 'LLM Non Disponible'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {status.available
                  ? 'Le service LLM local est prêt à utiliser'
                  : 'Assurez-vous que Ollama est lancé sur ' + status.url}
              </p>
            </div>
          </div>

          {/* Current Model */}
          <div>
            <p className="text-sm font-medium mb-2">Modèle actuel</p>
            <div className="p-2 bg-blue-50 text-blue-800 rounded text-sm">
              {status.current_model}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Le modèle utilisé pour la vérification des mots de passe et l'assistant IA
            </p>
          </div>

          {/* Available Models */}
          {status.available_models.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Modèles disponibles</p>
              <div className="space-y-1 text-sm">
                {status.available_models.map((model) => (
                  <div
                    key={model}
                    className={`p-2 rounded border ${
                      model === status.current_model
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {model}
                    {model === status.current_model && (
                      <span className="ml-2 text-xs font-semibold">✓ Actif</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URL Info */}
          <div>
            <p className="text-sm font-medium mb-2">Serveur Ollama</p>
            <div className="p-2 bg-gray-50 text-gray-700 rounded text-xs font-mono">
              {status.url}
            </div>
          </div>

          {/* Installation Instructions */}
          {!status.available && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Installation requise</AlertTitle>
              <AlertDescription>
                <p className="text-sm mb-2">
                  Pour utiliser l'assistant IA et la vérification avancée des mots de passe,
                  installez Ollama:
                </p>
                <ol className="text-xs space-y-1 list-decimal list-inside">
                  <li>Visitez <a href="https://ollama.ai" className="underline text-blue-600">ollama.ai</a></li>
                  <li>Téléchargez et installez Ollama</li>
                  <li>Téléchargez un modèle: <code className="bg-gray-200 px-1">ollama pull mistral</code></li>
                  <li>Lancez Ollama (il s'exécutera automatiquement sur le port 11434)</li>
                  <li>Rafraîchissez cette page</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LLMStatusIndicator;
