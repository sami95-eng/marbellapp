# Marbell'app — TODO

> ℹ️ Sur Windows, `TODO.md` et `todo.md` désignent le même fichier (système insensible à la casse). Ce fichier fait foi.
> Dernière mise à jour : **2026-06-10**.

---

# 🔝 ÉTAT ACTUEL — À FAIRE EN PRIORITÉ

## 1) Configurations externes à faire (hors code, côté comptes)

### 📧 Emails (Resend) — bloquant pour la livraison réelle
- [ ] **Vérifier un domaine chez Resend** (sinon mode test : Resend ne livre qu'à l'adresse propriétaire du compte → le client ne reçoit rien).
- [ ] Définir les **secrets de l'Edge Function** `booking-notification` dans Supabase (Dashboard → Edge Functions → Secrets) :
  - [ ] `RESEND_API_KEY`
  - [ ] `FROM_EMAIL` (une adresse du domaine vérifié, ex. `no-reply@marbellapp.com`)
  - [ ] `ADMIN_EMAIL` (destinataire des récaps admin)
- Rappel : l'expéditeur est toujours **Marbell'app** et la signature **« L'équipe Marbell'app »** (jamais le nom du venue).

### 🔐 Supabase RLS — bloquant pour le dashboard partenaire
- [ ] Exécuter le SQL des policies + rôle (fichiers `supabase/booking_status_partner.sql` ou `supabase/diagnose_partner_update.sql`) :
  - [ ] Policy SELECT `Partners view all bookings`
  - [ ] Policy UPDATE `Partners update all bookings` (avec `USING` **et** `WITH CHECK`)
  - [ ] `profiles.role = 'admin'` (ou `'partner'`) pour le compte établissement (`samidumont95@gmail.com`)

### 🟢 Google OAuth — uniquement si on réactive (code déjà prêt, bouton retiré)
- [ ] Google Cloud Console : OAuth client *Web*, redirect URI = `https://dbuaonbrjulbvowptqde.supabase.co/auth/v1/callback`
- [ ] Supabase → Auth → Providers → Google (Client ID + Secret)
- [ ] Supabase → Auth → URL Configuration → Redirect URLs (`…/oauth/callback`, localhost, scheme natif)

### 📱 Login SMS (Twilio) — uniquement si on réactive (code déjà prêt, bouton retiré)
- [ ] Twilio : Account SID, Auth Token, Messaging Service SID (ou numéro)
- [ ] Supabase → Auth → Providers → **Phone** → Twilio
- [ ] En test : numéros destinataires vérifiés (compte trial)

## 2) Fonctionnalités en attente
- [ ] **Emails/notifs de rappel automatiques** (ex. J-1 avant la réservation) — aucun cron/déclencheur en place aujourd'hui. Le type d'email est prêt à hériter de la signature Marbell'app.
- [ ] **Date/heure picker** dans la modification de réservation (dashboard partenaire) — actuellement champs texte `AAAA-MM-JJ` / `HH:MM`.
- [ ] **Réactiver le login Google** (remettre le bouton dans `app/login.tsx`, voir helper `lib/google-auth.ts`).
- [ ] **Réactiver le login par SMS** (remettre le bouton `login.phoneBtn` → `app/login-phone.tsx`).
- [ ] **Recherche globale** (écran d'accueil).
- [ ] **Édition du profil** + animation du cœur favoris + filtre par distance.

## 3) Améliorations prévues
- [ ] **Mapping partenaire → venue** : ajouter `owner_id` sur `venues` pour restreindre chaque partenaire à SES réservations (actuellement tout compte partner/admin voit/gère TOUTES les réservations — console mono-venue).
- [ ] Vérification d'email à l'inscription.
- [ ] Tests des flows utilisateur + tests iOS/Android.

## 🧩 Login — providers disponibles (état)
- [x] **Email / mot de passe** (Supabase `signInWithPassword` / `signUp`) — ✅ actif (onglets Utilisateur + Établissement)
- [~] **Google OAuth** — code prêt (`lib/google-auth.ts`, `app/oauth/callback.tsx`), **bouton retiré**, à reconfigurer
- [~] **Téléphone / OTP SMS** — code prêt (`app/login-phone.tsx`, clés `loginPhone.*`), **bouton retiré**, à reconfigurer (Twilio)
- [ ] ~~Apple~~ / ~~Instagram~~ — retirés du login

## 🚀 Notes de déploiement
- Web : `npm run export:web` puis **`npx vercel@54.9.0 --prod --yes`** (version Vercel CLI épinglée — ne pas utiliser 54.10.x).
- Edge Function : `npx supabase functions deploy booking-notification`.
- Prod : https://marbella-secret-society.vercel.app

---

# 📜 HISTORIQUE / BACKLOG D'ORIGINE

## Core Features

### Authentication & Onboarding
- [x] Splash screen avec animation d'accueil
- [x] Écran de login/register avec Manus OAuth
- [x] Intégration OAuth (Manus)
- [ ] Vérification d'email
- [x] Persistance de session utilisateur

### Home Screen (Compass)
- [x] Affichage des catégories principales (Beach Clubs, Fine Dining, Spas, Nightlife, Events)
- [x] Carousel des offres en vedette
- [x] Section "Trending Now"
- [x] Animation de chargement élégante avec logo doré
- [ ] Recherche globale
- [x] Navigation vers catégories

### Venue Discovery
- [x] Liste des établissements par catégorie
- [x] Filtres (prix, rating, distance)
- [x] Tri (populaire, nouveau, rating)
- [x] Affichage des images et informations de base
- [x] Écran de détail du venue

### Venue Details
- [x] Galerie d'images (carrousel)
- [x] Description et atmosphère
- [x] Horaires d'ouverture
- [x] Localisation sur carte
- [x] Offres disponibles
- [x] Avis et ratings
- [x] Bouton de réservation
- [x] Bouton de partage

### Booking & Reservations
- [x] Formulaire de réservation
- [x] Sélection date/heure
- [x] Nombre de personnes
- [x] Notes spéciales
- [x] Confirmation de réservation
- [x] Notification de confirmation

### My Reservations Screen
- [x] Affichage des réservations à venir
- [x] Affichage de l'historique
- [x] Statuts de réservation (Pending, Confirmed, Completed, Cancelled)
- [x] Actions (annuler, modifier, laisser un avis)
- [x] Onglets Upcoming/Past
- [x] Statistiques de réservation

### User Profile
- [x] Affichage du profil utilisateur
- [x] Avatar et bio
- [x] Statistiques (expériences, photos, followers)
- [x] Portfolio de photos
- [x] Badges et achievements
- [ ] Édition du profil

### Notifications
- [x] Écran de notifications
- [x] Notifications de nouvelles offres
- [x] Confirmations de réservation
- [x] Rappels d'expériences
- [x] Marquer comme lu

### Settings
- [x] Préférences de notification
- [x] Catégories d'intérêt
- [ ] Paramètres de confidentialité
- [ ] À propos / Aide
- [ ] Déconnexion

## Design & Branding
- [x] Générer logo/icon de l'application
- [x] Configurer app.config.ts avec branding
- [x] Implémenter palette de couleurs (Gold, Navy, Teal)
- [ ] Créer composants réutilisables
- [x] Implémenter thème dark mode

## Backend & Data
- [ ] Configurer base de données (venues, bookings, users)
- [ ] API endpoints pour venues
- [ ] API endpoints pour bookings
- [ ] API endpoints pour user profile
- [ ] Système de notifications
- [ ] Gestion des images (upload/storage)

## Testing & Polish
- [x] Tests unitaires des composants clés
- [ ] Tests des flows utilisateur
- [ ] Optimisation des performances
- [ ] Vérification de l'accessibilité
- [ ] Tests sur iOS et Android

## Deployment
- [ ] Configuration pour production
- [ ] Build APK/IPA
- [ ] Soumission app stores

## Nouvelles Fonctionnalités (Session du 01/06/2026)

### Système de Favoris
- [x] Créer un contexte/store pour gérer les favoris
- [x] Persistance locale avec AsyncStorage
- [x] Bouton cœur sur chaque venue card
- [x] Bouton cœur sur la page de détail
- [x] Écran "Mes Favoris" accessible depuis le profil
- [ ] Animation du cœur lors de l'ajout/retrait

### Filtres Avancés
- [x] Composant modal de filtres
- [x] Filtre par prix (€, €€, €€€, €€€€)
- [x] Filtre par rating (1-5 étoiles)
- [ ] Filtre par distance
- [x] Filtre par type de cuisine/ambiance
- [x] Tri (populaire, nouveau, rating, prix)
- [x] Intégration dans l'écran venues

### Notifications Push
- [x] Configuration expo-notifications
- [x] Écran de notifications avec liste
- [x] Types de notifications (offres, confirmations, rappels)
- [x] Badge de notification sur l'icône
- [x] Marquer comme lu/non lu
- [x] Paramètres de notifications

## Carrousel de Photos (Session du 01/06/2026)
- [x] Créer composant ImageCarousel réutilisable
- [x] Ajouter des images réelles pour chaque venue (14 photos)
- [x] Intégrer le carrousel dans la page de détail
- [x] Indicateurs de pagination (dots)
- [x] Support du swipe horizontal
- [x] Compteur d'images (1/3)
- [x] Captions sur les photos

## Enrichissement Base de Données (Session 01/06/2026) ✅
- [x] Rechercher les meilleurs établissements réels de Marbella
- [x] Ajouter 3+ nouveaux Beach Clubs (Playa Padre, Opium Beach, Amàre Beach)
- [x] Ajouter 3+ nouveaux restaurants Fine Dining (Skina 2★, Messina, Ta-Kumi)
- [x] Ajouter 2+ nouveaux Spas & Wellness (Finca Cortesín, Amàre Spa)
- [x] Ajouter 3+ nouveaux Nightlife (Mirage, Aqwa Mist)
- [x] Ajouter 2+ nouveaux Events/Shopping (Starlite Festival, Tennis Club, La Cañada, Casco Antiguo)
- [x] Générer des photos pour chaque nouvel établissement (8 images)
- [x] Intégrer dans venues.tsx (liste)
- [x] Intégrer dans venue-detail.tsx (détails + carrousel)
- [x] Vérifier la cohérence des IDs entre les écrans
- [x] Mettre à jour les venues en vedette sur l'écran d'accueil

## Mode Sombre par Défaut (Session 01/06/2026) ✅
- [x] Forcer le thème dark par défaut
- [x] Renforcer les accents dorés (#D4AF37) sur fond sombre
- [x] Mettre à jour le splash screen pour le mode sombre
- [x] Vérifier la lisibilité de tous les écrans en dark mode
- [x] Connecter le switch Dark Mode dans Settings au vrai theme provider
- [x] StatusBar style "light" pour le mode sombre

## Nouveau Logo Marbell'app + Rubrique VIP Access (Session 01/06/2026)
- [x] Générer nouveau logo avec texte Marbell'app intégré
- [x] Déployer le logo sur toutes les pages (icon, splash, favicon)
- [x] Créer écran VIP Access principal
- [x] Section Tables d'Invitations (réservations VIP)
- [x] Section Réductions Événements (promos exclusives)
- [x] Section Offres Membres (avantages fidélité)
- [x] Intégrer VIP Access dans la navigation (onglet)
- [x] Ajouter des données de démonstration réalistes

## Navigation 4 Onglets (Session 01/06/2026) ✅
- [x] Restructurer la barre d'onglets avec 4 onglets (Home, VIP, Bookings, Profile)
- [x] Créer app/(tabs)/bookings.tsx avec gestion complète des réservations
- [x] Créer app/(tabs)/profile.tsx avec profil utilisateur et menu
- [x] Mettre à jour icon-symbol.tsx avec heart.fill et bell.fill
- [x] Corriger les chemins de navigation dans _layout.tsx

## Onboarding Interactif (Session 03/06/2026) ✅
- [x] Créer composant OnboardingCarousel avec swipe horizontal
- [x] Implémenter pagination avec dots et compteur
- [x] Créer 3 écrans d'onboarding (Welcome, Categories, VIP)
- [x] Créer hook useOnboarding pour gérer l'état persistant
- [x] Intégrer dans le flux d'authentification (après login)
- [x] Ajouter boutons Skip/Next/Back/Get Started
- [x] Écrire 30 tests unitaires pour l'onboarding
- [x] Tous les tests passent (30/30 ✅)
