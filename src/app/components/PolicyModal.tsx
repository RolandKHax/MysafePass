import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Box, Typography, Stack, Button } from '@mui/material';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const policies = {
  privacy: {
    title: 'Politique de Confidentialité',
    subtitle: 'Conforme RGPD · Projet académique MySafePass',
    content: [
      { heading: '1. Responsable du traitement', text: "MySafePass est un projet académique. Le responsable du traitement est l'équipe étudiante du projet, joignable via les coordonnées de votre établissement." },
      { heading: '2. Base légale (RGPD art. 6)', text: "Le traitement repose sur l'exécution du contrat (création et utilisation du coffre, art. 6.1.b) et sur votre consentement explicite à l'inscription (art. 6.1.a) pour les traitements optionnels." },
      { heading: '3. Données collectées (minimisation)', text: "Seules les données strictement nécessaires sont collectées : un nom d'utilisateur (pseudonyme libre), votre coffre chiffré stocké localement et un journal de sécurité local. L'adresse e-mail est facultative et utilisée uniquement si vous la fournissez." },
      { heading: '4. Aucune donnée sensible', text: "MySafePass interdit le traitement des catégories particulières de données mentionnées à l'article 9 du RGPD (origine, santé, opinions politiques, religion, vie sexuelle, données biométriques, etc.). Aucun champ de l'application ne doit contenir de telles informations." },
      { heading: '5. Chiffrement zéro-connaissance', text: "Toutes les entrées sont chiffrées en AES-256-GCM avec une clé dérivée du mot de passe maître via PBKDF2 (250 000 itérations). Le mot de passe maître n'est jamais stocké, ni transmis au serveur. Ni l'équipe MySafePass ni un tiers ne peuvent déchiffrer votre coffre." },
      { heading: '6. Intelligence artificielle locale', text: "Deux modèles d'IA sont utilisés exclusivement en local (via Ollama) : un assistant conversationnel et un générateur de mots de passe. Aucun mot de passe, identifiant, e-mail ou contenu de coffre n'est transmis à un service tiers ni utilisé pour l'entraînement de modèles. Un filtre anti-PII est appliqué avant tout envoi à l'IA." },
      { heading: '7. Conservation', text: "Les données sont conservées localement tant que vous utilisez l'application. Vous pouvez supprimer votre coffre et toutes les données associées à tout moment depuis votre appareil (suppression du stockage local et du fichier SQLite)." },
      { heading: '8. Vos droits (RGPD art. 15-22)', text: "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité (export chiffré disponible) et d'opposition. Le traitement étant local, vous exercez ces droits directement depuis votre appareil." },
      { heading: '9. Sécurité', text: "Mesures techniques : AES-256-GCM, PBKDF2, hachage Argon2 du mot de passe maître, verrouillage automatique après 3 heures d'inactivité, blocage progressif après tentatives infructueuses, journal d'audit local." },
      { heading: '10. Aucun transfert hors UE', text: "Aucune donnée n'est transférée vers un pays tiers. Tout reste sur votre appareil." },
      { heading: '11. Cookies & traceurs', text: "MySafePass n'utilise aucun cookie publicitaire ni traceur tiers." },
      { heading: '12. Contact / Réclamation', text: "Pour toute question, contactez l'équipe pédagogique. Vous pouvez introduire une réclamation auprès de la CNIL (cnil.fr) si vous estimez que vos droits ne sont pas respectés." },
    ],
  },
  terms: {
    title: "Conditions d'Utilisation",
    subtitle: 'Conforme RGPD · Projet académique MySafePass',
    content: [
      { heading: '1. Acceptation', text: "En créant un compte ou en utilisant MySafePass, vous reconnaissez avoir lu et accepté les présentes conditions ainsi que la politique de confidentialité." },
      { heading: '2. Objet', text: "MySafePass est un gestionnaire de mots de passe local et chiffré, fourni à des fins strictement académiques et pédagogiques. Il n'est pas certifié pour un usage en production critique." },
      { heading: '3. Compte utilisateur', text: "Vous êtes seul responsable du choix, de la confidentialité et de la conservation de votre mot de passe maître. Aucune procédure de récupération n'est possible : sa perte entraîne la perte définitive du coffre." },
      { heading: '4. Usage autorisé', text: "Le service doit être utilisé conformément aux lois en vigueur. Toute tentative d'attaque, de rétro-ingénierie hostile, ou d'utilisation pour stocker du contenu illégal est strictement interdite." },
      { heading: '5. Données interdites', text: "Vous vous engagez à ne pas saisir dans le coffre, dans le chat IA ou dans tout autre champ : données de catégories particulières (RGPD art. 9), données médicales, biométriques, financières directement exploitables (PAN complet de carte bancaire), ou données concernant des tiers sans leur consentement." },
      { heading: '6. Intelligence artificielle', text: "Les fonctionnalités d'IA (assistant et générateur de mots de passe) sont des aides indicatives. Les analyses sont locales et ne remplacent pas un audit de sécurité professionnel." },
      { heading: '7. Limitation de responsabilité', text: "MySafePass est fourni « en l'état », sans garantie. Dans la limite du droit applicable, l'équipe du projet ne saurait être tenue responsable des pertes de données, indisponibilités ou dommages indirects." },
      { heading: '8. Disponibilité', text: "Le service peut être suspendu ou modifié à des fins pédagogiques. Vous conservez à tout moment la possibilité d'exporter votre coffre chiffré." },
      { heading: '9. Modification des conditions', text: "Les présentes conditions peuvent évoluer. Les modifications substantielles seront notifiées dans l'application." },
      { heading: '10. Droit applicable', text: "Les présentes conditions sont soumises au droit français et au RGPD (Règlement (UE) 2016/679)." },
      { heading: '11. Contact', text: "Pour toute question relative aux présentes conditions, contactez l'équipe pédagogique du projet MySafePass." },
    ],
  },
};

export function PolicyModal({ isOpen, onClose, type }: PolicyModalProps) {
  const policy = policies[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
          >
            <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Box
              className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl border overflow-hidden flex flex-col"
              style={{ backgroundColor: 'rgba(13, 13, 13, 0.96)', borderColor: 'rgba(108,99,255,0.18)' }}
              onClick={(event: React.MouseEvent<HTMLDivElement>) => event.stopPropagation()}
            >
              <Box sx={{ flexShrink: 0, borderBottom: '1px solid rgba(108,99,255,0.12)', px: 6, pt: 5, pb: 4, position: 'relative' }}>
                <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-white">
                  <X className="h-5 w-5" />
                </button>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--msp-text1)' }}>{policy.title}</Typography>
                <Typography sx={{ mt: 1, color: 'var(--msp-text3)', fontSize: '0.875rem' }}>
                  {policy.subtitle}
                </Typography>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', px: 6, py: 4, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(108,99,255,0.35)', borderRadius: '3px' } }}>
                <Stack spacing={3}>
                  {policy.content.map((section, index) => (
                    <Box key={index}>
                      <Typography sx={{ fontWeight: 600, mb: 1, color: 'var(--msp-accent)', fontSize: '0.95rem' }}>{section.heading}</Typography>
                      <Typography sx={{ color: 'var(--msp-text2)', fontSize: '0.875rem', lineHeight: 1.7 }}>{section.text}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Box sx={{ flexShrink: 0, borderTop: '1px solid rgba(108,99,255,0.12)', px: 6, py: 4, bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
                <Button fullWidth onClick={onClose} sx={{ background: 'var(--msp-accent)', color: 'white', textTransform: 'none', fontWeight: 600, py: 1.5, '&:hover': { opacity: 0.9 } }}>
                  Fermer
                </Button>
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
