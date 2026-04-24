import { Box, Container, Typography, Stack, Button } from '@mui/material';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';

const SECTIONS = [
  { h: '1. Responsable du traitement', t: "MySafePass est un projet académique. Le responsable du traitement est l'équipe étudiante du projet, joignable via les coordonnées de votre établissement." },
  { h: '2. Base légale (RGPD art. 6)', t: "Le traitement repose sur l'exécution du contrat (création et utilisation du coffre, art. 6.1.b) et sur votre consentement explicite à l'inscription (art. 6.1.a) pour les traitements optionnels." },
  { h: '3. Données collectées (minimisation)', t: "Seules les données strictement nécessaires sont collectées : un nom d'utilisateur (pseudonyme libre), votre coffre chiffré stocké localement et un journal de sécurité local. L'adresse e-mail est facultative et utilisée uniquement si vous la fournissez." },
  { h: '4. Aucune donnée sensible', t: "MySafePass interdit le traitement des catégories particulières de données mentionnées à l'article 9 du RGPD (origine raciale ou ethnique, opinions politiques, convictions religieuses, données génétiques ou biométriques, santé, vie sexuelle ou orientation sexuelle). Aucun champ de l'application ne doit contenir de telles informations." },
  { h: '5. Chiffrement zéro-connaissance', t: "Toutes les entrées du coffre sont chiffrées en AES-256-GCM avec une clé dérivée du mot de passe maître via PBKDF2 (250 000 itérations). Le mot de passe maître n'est jamais stocké, ni transmis au serveur. Ni l'équipe MySafePass ni un tiers ne peuvent déchiffrer votre coffre." },
  { h: '6. Intelligence artificielle locale', t: "Deux modèles d'IA sont utilisés exclusivement en local (via Ollama) : (1) un assistant conversationnel qui évalue la robustesse du mot de passe maître et répond à vos questions de sécurité ; (2) un générateur dédié à la création de mots de passe forts. Aucun mot de passe, identifiant, e-mail ou contenu de coffre n'est transmis à un service tiers ni utilisé pour l'entraînement de modèles. Un filtre anti-PII est appliqué avant tout envoi à l'IA." },
  { h: '7. Conservation', t: "Les données sont conservées localement tant que vous utilisez l'application. Vous pouvez supprimer votre coffre et toutes les données associées à tout moment depuis votre appareil." },
  { h: '8. Vos droits (RGPD art. 15-22)', t: "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité (export chiffré disponible) et d'opposition. Le traitement étant local, vous exercez ces droits directement depuis votre appareil." },
  { h: '9. Sécurité', t: "Mesures techniques : AES-256-GCM, PBKDF2 (250 000 itérations), hachage Argon2 du mot de passe maître, verrouillage automatique après 3 heures d'inactivité, blocage progressif après tentatives infructueuses, journal d'audit local." },
  { h: '10. Aucun transfert hors UE', t: "Aucune donnée n'est transférée vers un pays tiers ou une organisation internationale. Tout reste sur votre appareil." },
  { h: '11. Cookies et traceurs', t: "MySafePass n'utilise aucun cookie publicitaire ni traceur tiers." },
  { h: '12. Contact / Réclamation', t: "Pour toute question, contactez l'équipe pédagogique. Vous pouvez introduire une réclamation auprès de la CNIL (cnil.fr) si vous estimez que vos droits ne sont pas respectés." },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0D0D0D', py: 6 }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowLeft size={20} />} onClick={() => navigate(-1)} sx={{ color: '#6C63FF', textTransform: 'none', mb: 4, '&:hover': { bgcolor: 'rgba(108,99,255,0.1)' } }}>
          Retour
        </Button>

        <Box sx={{ background: 'rgba(20, 20, 22, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 3, p: { xs: 4, md: 6 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 2, background: 'linear-gradient(135deg, #6C63FF 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={28} color="white" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.1 }}>Politique de Confidentialité</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mt: 0.5 }}>Conforme RGPD · Mise à jour avril 2026</Typography>
            </Box>
          </Box>

          <Stack spacing={3.5}>
            {SECTIONS.map((s) => (
              <Box key={s.h}>
                <Typography sx={{ fontWeight: 600, mb: 1, color: '#6C63FF' }}>{s.h}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, fontSize: '0.95rem' }}>{s.t}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
