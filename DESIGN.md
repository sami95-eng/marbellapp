---
name: Marbell'app
description: La conciergerie or-sur-nuit des expériences de luxe à Marbella
colors:
  gold: "#D4AF37"
  ink: "#0A0E13"
  surface: "#141A22"
  cream: "#F8F4EC"
  muted: "#9CA3AF"
  border: "#2A3040"
  gold-hairline: "#D4AF3733"
  success: "#4ADE80"
  warning: "#FBBF24"
  error: "#F87171"
  teal: "#2DD4BF"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'SF Pro Display', Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.2
  title:
    fontFamily: "system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "1px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "16px 28px"
  button-ghost:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  chip-selected:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px"
---

# Design System: Marbell'app

## 1. Overview

**Creative North Star: "La Nuit Méditerranéenne"**

Marbell'app a l'allure d'une nuit profonde sur la Costa del Sol : un fond
noir-bleuté (`#0A0E13`) dans lequel l'or (`#D4AF37`) joue le rôle des lumières
de Marbella après le coucher du soleil — rare, chaud, précis. Le système est
sombre par défaut, dense en contenu (photos de lieux) mais aéré dans sa mise en
page. L'or n'est jamais une surface : c'est un accent ponctuel (un CTA, une
note, un palier VIP) dont la **rareté fait la valeur**.

C'est un registre **product** au service de la réservation, mais habillé d'une
peau premium. La hiérarchie est portée par le poids typographique et l'espace,
pas par la couleur ou l'ornement. Le luxe se ressent par la retenue et la
précision — la clarté d'un prix, la netteté d'une photo plein cadre — jamais par
l'esbroufe.

Ce système **rejette explicitement** : le faux-luxe clinquant (or tape-à-l'œil,
dégradés agressifs), le template SaaS bleu générique, et la surcharge visuelle.
La place vide fait partie du luxe.

**Key Characteristics:**
- Sombre par défaut : encre `#0A0E13`, surfaces `#141A22`, texte crème `#F8F4EC`.
- L'or comme signature rare, pas comme remplissage.
- Profondeur par couches tonales + filet d'or, pas par ombres lourdes.
- Coins généreux (cartes 16 px, boutons en pilule) ; densité maîtrisée.
- Mobile-first, multilingue (FR/EN/ES/RU), cibles tactiles ≥ 44 px.

## 2. Colors

Une palette nocturne : une seule voix dorée sur un fond noir-bleuté, des crèmes
chaudes pour le texte, un teal en accent secondaire discret.

### Primary
- **Or de Marbella** (`#D4AF37`) : accent signature — CTAs, prix, badges, palier
  VIP, libellés actifs, filets de carte. Réservé aux éléments qui méritent
  l'attention ; jamais en aplat de fond.

### Secondary
- **Teal Méditerranée** (`#2DD4BF`) : accent secondaire rare (états/illustrations
  ponctuelles). Ne concurrence jamais l'or sur un même écran.

### Neutral
- **Encre Nocturne** (`#0A0E13`) : fond global de l'app.
- **Surface Navy** (`#141A22`) : cartes, modals, champs, feuilles. La couche
  au-dessus de l'encre.
- **Crème Chaude** (`#F8F4EC`) : texte principal et titres sur fond sombre.
- **Gris Lisible** (`#9CA3AF`) : texte secondaire, libellés, métadonnées.
- **Bordure Navy** (`#2A3040`) : séparations neutres discrètes.
- **Filet d'Or** (`#D4AF3733`) : bordure dorée translucide (~20 %) qui cercle les
  cartes premium — la signature de surface du système.

### Feedback
- **Succès** (`#4ADE80`) · **Alerte** (`#FBBF24`) · **Erreur** (`#F87171`) :
  uniquement pour le statut (confirmé, en attente, annulé, validation de champ).

### Named Rules
**La Règle de la Voix Unique.** L'or ne couvre jamais plus de ~10 % d'un écran.
Sa rareté est le sujet. Si deux éléments dorés se disputent l'attention sur la
même vue, l'un des deux a tort.

**La Règle du Vert-pour-le-Vrai.** Le vert, l'ambre et le rouge sont *réservés au
statut*. Jamais décoratifs : un badge vert veut dire « confirmé / payé », pas
« joli ».

## 3. Typography

**Display Font:** Sans système (SF Pro sur iOS, Roboto sur Android, `system-ui`
sur web).
**Body Font:** la même famille système.

**Character:** Pas de police custom — la personnalité vient du **poids** et de
l'**espacement**, pas d'un serif décoratif. Les titres sont très gras (800-900),
les libellés petits et espacés en capitales. Net, contemporain, sans afféterie.

### Hierarchy
- **Display** (900, 28-30 px, line-height ~1.1, tracking serré) : logo
  « Marbell'app », titres d'écran (« Réservation », montants clés).
- **Headline** (800, 22-26 px) : titres de section et de carte (nom de venue en
  fiche).
- **Title** (700, 15-16 px) : noms d'éléments dans les listes, titres de cartes.
- **Body** (400-600, 13-15 px) : descriptions, valeurs de champs, paragraphes.
- **Label** (700, 10-11 px, letter-spacing ~1 px, MAJUSCULES) : sur-titres et
  étiquettes (« TOTAL À PAYER », « NUMÉRO DE CONFIRMATION »).

### Named Rules
**La Règle de la Petite Capitale.** Les méta-étiquettes sont petites, grasses,
espacées et en gris (`#9CA3AF`) — jamais en or. L'or se réserve à la *valeur*
qu'elles annoncent, pas à l'annonce.

## 4. Elevation

Système **plat par défaut**. La profondeur se construit par **couches tonales**
(encre `#0A0E13` → surface `#141A22`) et par le **filet d'or translucide**, pas
par des ombres portées. Les ombres n'apparaissent qu'en réponse à un état
flottant : feuilles modales qui montent du bas, bandeau démo, boutons d'action
superposés sur une photo.

### Shadow Vocabulary (rare)
- **Overlay** (`box-shadow: 0 -8px 24px rgba(0,0,0,0.4)`) : feuilles/modales
  glissant depuis le bas (avis, fiche client, soumission VIP).
- **Floating control** (`elevation: 8` Android / ombre douce) : pastille flottante
  par-dessus une image (bandeau démo, badge).

### Named Rules
**La Règle du Plat-par-Défaut.** Une surface au repos est plate. Si tu ajoutes
une ombre, c'est qu'un état le justifie (overlay, flottement). Sinon, c'est le
contraste tonal et le filet d'or qui portent la séparation.

## 5. Components

### Buttons
- **Shape:** pilule (`border-radius: 9999px`).
- **Primary:** fond or `#D4AF37`, texte encre `#0A0E13`, gras 800, padding
  ~16 px vertical. Le seul aplat doré de l'interface — donc rare et décisif
  (« Confirmer et payer », « Rejoindre le Club VIP »).
- **Disabled:** fond `#333`, texte gris — clairement éteint.
- **Ghost / Secondary:** fond transparent sur l'encre, texte crème, **bordure
  1 px** crème/or translucide. Pour les actions non primaires (« Retour »,
  « Partager »).

### Chips
- **Style:** pilule, fond surface `#141A22`, texte gris `#9CA3AF`, fine bordure.
- **State:** sélectionnée → fond or `#D4AF37`, texte encre. Catégories, filtres,
  langues, créneaux, sélecteurs de venue.

### Cards / Containers
- **Corner Style:** doux (16-20 px).
- **Background:** surface `#141A22`.
- **Border:** **filet d'or** `#D4AF3733` (~1 px) — la signature premium. Bordure
  navy `#2A3040` pour les cartes neutres.
- **Shadow Strategy:** aucune au repos (voir Elevation).
- **Internal Padding:** 14-16 px.

### Inputs / Fields
- **Style:** fond surface `#141A22`, texte crème, coins 12 px, fine bordure.
- **Label:** petite capitale grise au-dessus (voir Typography).
- **Error:** bordure rouge `#F87171` + message court rouge sous le champ.
- **Disabled / placeholder:** gris foncé `#555`.

### Navigation
- **Bottom tabs** (app shell) : fond encre, icône+label, onglet actif en or.
- **Dashboard partenaire** : barre d'onglets scrollable horizontale ; onglet
  actif = pastille or sur texte encre, inactifs = surface + texte gris.

### Signature: la Fiche Lieu
Photo plein cadre (carrousel) sans chrome, sur laquelle flotte une nav
translucide ; sous la photo, un bloc dense mais aéré (titre headline, badge
rating doré, chips catégorie/prix, sections « À propos / Ambiance / Infos /
Galerie / Avis »). La photo est le héros ; l'UI se retire.

## 6. Do's and Don'ts

### Do:
- **Do** garder l'or pour ≤ 10 % de l'écran : CTA, prix, badge, palier VIP.
- **Do** porter la profondeur par les **couches tonales** (`#0A0E13` → `#141A22`)
  et le **filet d'or** `#D4AF3733`, pas par des ombres.
- **Do** réserver vert/ambre/rouge au **statut** (confirmé / en attente / erreur).
- **Do** laisser respirer : la place vide est un signe de luxe, pas un manque.
- **Do** laisser **la vraie photo du lieu** être le héros, pleine largeur.
- **Do** garder des cibles tactiles ≥ 44 px et des conteneurs tolérants aux
  longueurs FR/EN/ES/RU.

### Don't:
- **Don't** faire du **clinquant/criard** : pas d'or en aplats de fond, pas de
  dégradés dorés agressifs, pas d'effet « bling » — le faux-luxe est interdit.
- **Don't** glisser vers le **template SaaS bleu générique** : aucun bleu
  corporate, aucun look « dashboard par défaut » sans identité.
- **Don't** **surcharger** l'écran : pas de densité étouffante, toujours une
  respiration ; si c'est bruyant, retirer plutôt qu'ajouter.
- **Don't** utiliser des **photos génériques/placeholder** comme finalité : une
  Unsplash neutre trahit le principe « le lieu est le héros ».
- **Don't** mettre une étiquette en or : l'or va à la *valeur*, pas à son libellé.
