import { Box, Container, Typography, Stack, Button } from '@mui/material';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';

const SECTIONS = [
  { h: '1. Acceptation', t: "En créant un compte ou en utilisant MySafePass, vous reconnaissez avoir lu et accepté les présentes conditions ainsi que la politique de confidentialité." },
  { h: '2. Objet', t: "MySafePass est un gestionnaire de mots de passe local et chiffré, fourni à des fins strictement académiques et pédagogiques. Il n'est pas certifié pour un usage en production critique." },
  { h: '3. Compte utilisateur', t: "Vous êtes seul responsable du choix, de la confidentialité et de la conservation de votre mot de passe maître. Aucune procédure de récupération n'est possible : sa perte entraîne la perte définitive du coffre." },
  { h: '4. Usage autorisé', t: "Le service doit être utilisé conformément aux lois en vigueur. Toute tentative d'attaque, de rétro-ingénierie hostile, ou d'utilisation pour stocker du contenu illégal est strictement interdite." },
  { h: '5. Données interdites (RGPD art. 9)', t: "Vous vous engagez à ne pas saisir dans le coffre, dans le chat IA ou dans tout autre champ : données de catégories particulières (origine, opinions politiques ou religieuses, données de santé, génétiques ou biométriques, vie sexuelle), données médicales, ou données concernant des tiers sans leur consentement explicite." },
  { h: '6. Intelligence artificielle locale', t: "L'application embarque deux modèles d'IA exécutés exclusivement en local : un assistant conversationnel et un générateur de mots de passe. Les analyses sont indicatives et ne remplacent pas un audit de sécurité professionnel. Aucun contenu n'est envoyé à un service tiers." },
  { h: '7. Limitation de responsabilité', t: "MySafePass est fourni « en l'état », sans garantie expresse ou implicite. Dans la limite du droit applicable, l'équipe du projet ne saurait être tenue responsable des pertes de données, indisponibilités, dommages indirects ou conséquences d'un usage inapproprié." },
  { h: '8. Disponibilité', t: "Le service peut être suspendu ou modifié à des fins pédagogiques. Vous conservez à tout moment la possibilité d'exporter votre coffre chiffré au format portable." },
  { h: '9. Propriété intellectuelle', t: "Le code source et la documentation sont publiés à des fins éducatives. Toute réutilisation doit citer le projet d'origine." },
  { h: '10. Modification des conditions', t: "Les présentes conditions peuvent évoluer. Les modifications substantielles seront notifiées dans l'application." },
  { h: '11. Droit applicable', t: "Les présentes conditions sont soumises au droit français et au RGPD (Règlement (UE) 2016/679)." },
  { h: '12. Contact', t: "Pour toute question relative aux présentes conditions, contactez l'équipe pédagogique du projet MySafePass." },
];

export default function TermsOfService() {
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
              <FileText size={28} color="white" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.1 }}>Conditions d'Utilisation</Typography>
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
