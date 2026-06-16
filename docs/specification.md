Knight Companion

Objectif

Application web compagnon pour le jeu de rôle Knight.

Les personnages sont importés depuis Foundry VTT via un export JSON d’Actor.

Les joueurs ont un accès en lecture seule.

Le MJ est administrateur et peut modifier les données de progression.

⸻

Utilisateurs

MJ (administrateur)

Peut :

* importer un personnage depuis Foundry
* modifier les blocs de progression
* réordonner les blocs de progression
* attribuer un personnage à un joueur
* modifier les notes du personnage

Joueur (chaque joueur à un personnage)

Peut :

* consulter son personnage
* consulter sa méta-armure
* consulter son équipement
* consulter sa progression
* consulter son évolution

Ne peut effectuer aucune modification.

⸻

Structure de l’application

Chaque personnage a une adresse unique basée sur son Surnom (callsign). Les onglets qui suivent sont tous basés sur cette adresse unique

Personnage

Affiche uniquement les valeurs actuelles :

* Portrait (photo à importer en fichier image)
* Nom
* Surnom
* Âge
* Archétype
* Section
* Blason
* Haut-fait

Ressources :

* Santé (actuelle, maximum)
* Espoir (actuel, maximum)
* Héroïsme (actuel, maximum)
* Égide
* Défense
* Réaction

Aspects et caractéristiques :

* Chair
    Les 3 caractéristiques associés
* Bête
    Les 3 caractéristiques associés
* Machine
    Les 3 caractéristiques associés
* Dame
    Les 3 caractéristiques associés
* Masque
    Les 3 caractéristiques associés


Biographie :

* Description
* Histoire
* Motivations
* Langues
* Distinctions

⸻

Méta-armure

Affiche :

* Nom de l’armure
* Génération
* Armure (actuelle, maximum)
* Champ de Force
* Énergie (actuelle, maximum)
* IA embarquée
* Capacités
* Description

⸻

Équipement

Sous-onglets :

Armes

Tableau des armes.

Modules

Tableau des modules.

Divers

Autres objets.

⸻

Progression

Historique de progression.

Composé de blocs unitaires :

Exemple :

+1 Chair
+1 Chair
+1 Force
+1 Tir

Les blocs sont ordonnés.

Le MJ peut les réordonner.

Les joueurs sont en lecture seule.

⸻

Évolution

Comparaison :

Initial / Actuel / Gain (avec une couleur différente selon le niveau de gain)

Exemple :

Chair : 3 → 4 (+1)

Bête : 4 → 6 (+2)

Tir : 3 → 5 (+2)

⸻

Import Foundry

Le JSON Foundry complet doit être conservé.

Les données manuelles (comme l'ordonnancement des progressions) ne doivent jamais être écrasées lors d’un nouvel import.

Séparer :

* foundryData
* progressionBlocks
* notesMJ

⸻

Technologies

* Next.js
* TypeScript
* PostgreSQL
* Prisma
* TailwindCSS
* shadcn/ui