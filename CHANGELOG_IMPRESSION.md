# Changelog - Système d'impression Windows

## Version actuelle - Résolution du problème d'impression bloquée

### Problème identifié

L'impression sur Windows affichait "Page x sur document" avec un compteur qui s'incrémentait indéfiniment, sans que rien ne sorte de l'imprimante.

### Cause

L'ancienne implémentation utilisait PowerShell `Out-Printer` qui interprétait les données ESC/POS comme du texte au lieu de les envoyer directement à l'imprimante en mode RAW. Cela causait une boucle infinie car le spooler Windows essayait de formater les commandes binaires ESC/POS comme du texte.

### Solution implémentée

1. **Ajout de la dépendance Windows** (`Cargo.toml`)
   - Ajout de `windows = "0.58"` avec les features nécessaires pour l'impression RAW

2. **Nouvelle fonction `print_raw_windows`** (`src-tauri/src/printer.rs`)
   - Utilise l'API Windows native (`WritePrinter`)
   - Envoie les données en mode RAW directement au spooler
   - Gère correctement le cycle de vie du document d'impression:
     - `OpenPrinterW` - Ouvre l'imprimante
     - `StartDocPrinterW` - Démarre le document avec type "RAW"
     - `StartPagePrinter` - Démarre la page
     - `WritePrinter` - Écrit les données ESC/POS
     - `EndPagePrinter` - Termine la page
     - `EndDocPrinterW` - Termine le document
     - `ClosePrinter` - Ferme l'imprimante

3. **Simplification du code**
   - Remplacement de l'approche PowerShell par un simple appel à `print_raw_windows`
   - Suppression de la création de fichiers temporaires
   - Code plus propre et maintenable

### Fichiers modifiés

- `src-tauri/Cargo.toml` - Ajout dépendance Windows
- `src-tauri/src/printer.rs` - Nouvelle fonction d'impression RAW
- `IMPRESSION_THERMIQUE.md` - Mise à jour documentation

### Instructions de test

1. **Compiler l'application**
   ```bash
   npm run tauri build
   ```

2. **Sur Windows**
   - Installer l'application compilée
   - Connecter et configurer l'imprimante thermique
   - Noter le nom exact de l'imprimante (Paramètres > Imprimantes)
   - Lancer l'application
   - Tester l'impression depuis la page "Test Imprimante"

3. **Vérifications**
   - ✅ L'imprimante ne doit PAS afficher "Page x sur document"
   - ✅ Le ticket doit sortir immédiatement
   - ✅ Le formatage ESC/POS doit être respecté (gras, centrage, logo, etc.)
   - ✅ La coupure automatique du papier doit fonctionner

### Logs de débogage

En cas de problème, les logs suivants s'affichent dans la console :
- 🖨️ Impression RAW Windows sur: [nom imprimante]
- 📊 Taille des données: [x octets]
- 🔓 Ouverture de l'imprimante...
- ✅ Imprimante ouverte
- 📄 Démarrage du document...
- ✅ Document démarré
- 📃 Démarrage de la page...
- ✅ Page démarrée
- ✍️ Écriture des données...
- ✅ [x octets écrits]
- 🏁 Fin de la page...
- 🏁 Fin du document...
- 🔒 Fermeture de l'imprimante...
- ✅ Impression terminée avec succès

### Compatibilité

- ✅ Windows 7 et supérieur
- ✅ Windows 10/11
- ✅ Imprimantes thermiques ESC/POS (58mm, 80mm)
- ✅ Imprimantes USB et réseau (configurées localement)

### Notes importantes

1. **Nom de l'imprimante**: Doit être exactement celui affiché dans les paramètres Windows (sensible à la casse)
2. **Type d'imprimante**: Fonctionne avec toutes les imprimantes supportant le mode RAW
3. **Pilotes**: Les pilotes génériques ESC/POS sont suffisants
4. **Permissions**: Aucune permission administrateur nécessaire

### Rollback (en cas de problème)

Si cette version pose problème, vous pouvez revenir à l'ancienne version en:
1. Supprimant la dépendance `windows` du `Cargo.toml`
2. Revertant les changements dans `printer.rs` via git

### Support

Pour toute question ou problème:
1. Vérifier les logs de l'application
2. Consulter `IMPRESSION_THERMIQUE.md`
3. Tester avec la page "Test Imprimante"

---

**Date**: 2025-12-15
**Plateforme**: Windows
**Impact**: Critique - Résolution du bug bloquant l'impression
