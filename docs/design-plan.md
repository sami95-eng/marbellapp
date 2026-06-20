# Marbell'app - Design Plan

## Overview
Marbell'app est une plateforme exclusive et luxueuse connectant les créateurs de contenu (influenceurs, content creators) aux établissements haut de gamme de Marbella. Les membres échangent leur visibilité et contenu contre des expériences exclusives (restaurants, beach clubs, spas, événements).

## Screen List

1. **Splash / Onboarding** - Écran d'accueil mystérieux avec animation
2. **Login / Register** - Authentification (email, Instagram verification)
3. **Home / Compass** - Écran principal avec catégories d'expériences
4. **Venue List** - Liste des établissements par catégorie
5. **Venue Detail** - Détails d'un établissement avec offres
6. **Booking / Reservation** - Réserver une expérience
7. **My Bookings** - Mes réservations et historique
8. **Profile** - Profil utilisateur, statistiques, portfolio
9. **Notifications** - Notifications d'offres et confirmations
10. **Settings** - Paramètres, préférences, déconnexion

## Primary Content and Functionality

### Screen 1: Splash / Onboarding
- **Content**: Logo mystérieux, tagline "Unlock Marbella's Exclusive Lifestyle"
- **Functionality**: Animation de déverrouillage, transition vers login après 2-3 secondes

### Screen 2: Login / Register
- **Content**: Formulaire d'inscription (email, nom, Instagram handle)
- **Functionality**: Vérification Instagram, création de compte, connexion OAuth
- **Key Fields**: Email, Full Name, Instagram Handle, Password

### Screen 3: Home / Compass (Main Hub)
- **Content**: 
  - Header avec accueil personnalisé
  - Catégories principales en grille (Beach Clubs, Fine Dining, Spas & Wellness, Nightlife, Events)
  - Carousel des offres en vedette
  - Section "Trending Now" - établissements populaires
- **Functionality**: Navigation vers listes par catégorie, recherche, filtres

### Screen 4: Venue List
- **Content**: 
  - Liste des établissements avec images, nom, localisation
  - Cartes avec étoiles (rating)
  - Tags (VIP, Exclusive, New)
  - Distance / Temps d'accès
- **Functionality**: Tri (populaire, nouveau, rating), filtres (prix, type), recherche

### Screen 5: Venue Detail
- **Content**:
  - Image héroïque de l'établissement
  - Nom, localisation, contact
  - Description et atmosphère
  - Galerie photos
  - Offres disponibles (liste des deals)
  - Avis et ratings
  - Horaires d'ouverture
  - Bouton "Book Experience"
- **Functionality**: Réservation, partage, appel direct, direction GPS

### Screen 6: Booking / Reservation
- **Content**:
  - Récapitulatif de l'offre
  - Sélection de la date et heure
  - Nombre de personnes
  - Préférences spéciales (notes)
  - Conditions d'échange (contenu requis)
- **Functionality**: Confirmation, paiement (si applicable), notification

### Screen 7: My Bookings
- **Content**:
  - Onglets: Upcoming, Past, Cancelled
  - Cartes de réservation avec statut
  - Détails rapides et actions (annuler, modifier, partager)
- **Functionality**: Gestion des réservations, partage des photos post-expérience

### Screen 8: Profile
- **Content**:
  - Avatar et nom
  - Bio et Instagram link
  - Statistiques (expériences complétées, photos partagées, followers)
  - Portfolio de photos
  - Badges et achievements
- **Functionality**: Édition du profil, gestion des préférences de contenu

### Screen 9: Notifications
- **Content**: 
  - Liste des notifications (nouvelles offres, confirmations, rappels)
  - Timestamps et statut de lecture
- **Functionality**: Marquer comme lu, supprimer, naviguer vers détails

### Screen 10: Settings
- **Content**:
  - Préférences de notification
  - Catégories d'intérêt
  - Paramètres de confidentialité
  - À propos / Aide
  - Déconnexion
- **Functionality**: Mise à jour des préférences, gestion des permissions

## Key User Flows

### Flow 1: Discover & Book an Experience
1. User ouvre l'app → Home screen (Compass)
2. Parcourt les catégories ou utilise la recherche
3. Clique sur une catégorie → Venue List
4. Sélectionne un établissement → Venue Detail
5. Clique "Book Experience" → Booking screen
6. Confirme les détails → Confirmation
7. Reçoit notification de confirmation

### Flow 2: Manage Bookings & Share Content
1. User accède à "My Bookings"
2. Voit ses réservations à venir
3. Après l'expérience, partage des photos
4. Reçoit des badges/achievements pour participation

### Flow 3: Explore by Category
1. Home screen → Catégories en grille
2. Clique sur "Beach Clubs" → Venue List filtrée
3. Applique filtres supplémentaires (prix, rating)
4. Sélectionne un lieu → Détails → Booking

## Color Choices

**Brand Palette (Luxe & Mystérieux)**
- **Primary Gold**: #D4AF37 (accent, boutons, highlights)
- **Deep Navy**: #0F1419 (background, texte principal)
- **Charcoal**: #2A2A2A (surfaces, cartes)
- **Cream**: #F5F1E8 (texte secondaire, backgrounds clairs)
- **Accent Teal**: #1ABC9C (highlights secondaires, interactions)
- **Surface Dark**: #1A1A1A (cartes, modals)
- **Border Subtle**: #3A3A3A (séparations légères)

**Light Mode**:
- Background: #F5F1E8
- Surface: #FFFFFF
- Text Primary: #0F1419
- Text Secondary: #666666
- Accent: #D4AF37

**Dark Mode** (par défaut):
- Background: #0F1419
- Surface: #1A1A1A
- Text Primary: #F5F1E8
- Text Secondary: #B0B0B0
- Accent: #D4AF37

## Design Principles

1. **Exclusivité & Mystère**: Utiliser des images de haute qualité, des animations subtiles, des révélations progressives
2. **Luxe Minimaliste**: Espaces blancs généreux, typographie élégante, hiérarchie claire
3. **Accessibilité Mobile**: Conçu pour une main, touches faciles d'accès
4. **Orientation Portrait**: Optimisé pour 9:16 (iPhone standard)
5. **Interactions Fluides**: Transitions douces, feedback haptique, confirmations visuelles

## Technical Considerations

- **Navigation**: Tabs (Home, Bookings, Profile) + modals pour détails
- **Images**: Lazy loading, caching, optimisation pour mobile
- **Performance**: FlatList pour listes, pagination pour venues
- **Offline**: Cache local des favoris et réservations
- **Notifications**: Push notifications pour nouvelles offres et confirmations
