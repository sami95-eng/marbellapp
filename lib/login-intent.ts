// Intention de navigation post-login.
// Permet à l'onglet "Établissement" de rediriger vers /partner-dashboard après
// une connexion Supabase réussie, sans course avec AuthRedirect (_layout.tsx) :
// quel que soit celui qui navigue en premier, la destination est déterministe.
let partnerIntent = false;

export const setPartnerLoginIntent = (v: boolean) => { partnerIntent = v; };
export const consumePartnerLoginIntent = (): boolean => {
  const v = partnerIntent;
  partnerIntent = false;
  return v;
};
