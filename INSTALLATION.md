# Guide d'installation Fast App

## 🍎 Installation sur macOS

### Problème: "fast-app est endommagé et ne peut être ouvert"

Cette erreur est normale pour les applications non signées. Voici comment l'installer:

#### Méthode 1: Interface graphique (Recommandé)

1. **Téléchargez** le fichier `.dmg`
2. **Ouvrez** le `.dmg` et glissez l'app dans Applications
3. **NE PAS** double-cliquer sur l'app directement
4. Ouvrez **Finder** → **Applications**
5. **Ctrl + Clic** (ou clic droit) sur `fast-app`
6. Sélectionnez **"Ouvrir"**
7. Cliquez sur **"Ouvrir"** dans la boîte de dialogue
8. L'app se lancera et sera autorisée pour les prochaines fois

#### Méthode 2: Ligne de commande (Plus rapide)

Ouvrez le **Terminal** et exécutez:

```bash
# Supprimer la quarantaine de l'app
xattr -cr /Applications/fast-app.app

# Puis lancer l'app normalement
open /Applications/fast-app.app
```

#### Méthode 3: Désactiver temporairement Gatekeeper (Non recommandé)

```bash
# Désactiver Gatekeeper
sudo spctl --master-disable

# Installer l'app normalement

# Réactiver Gatekeeper (IMPORTANT!)
sudo spctl --master-enable
```

---

## 🪟 Installation sur Windows

### Problème: Windows Defender ou SmartScreen bloque l'installation

#### Solution 1: Utiliser l'installateur MSI (Recommandé)

1. **Téléchargez** le fichier `.msi`
2. **Clic droit** sur le fichier → **"Exécuter en tant qu'administrateur"**
3. Si Windows SmartScreen apparaît:
   - Cliquez sur **"Informations complémentaires"**
   - Cliquez sur **"Exécuter quand même"**

#### Solution 2: Utiliser l'installateur NSIS (.exe)

1. **Téléchargez** le fichier `.exe`
2. **Clic droit** sur le fichier → **"Exécuter en tant qu'administrateur"**
3. Si Windows Defender bloque:
   - Cliquez sur **"Plus d'infos"**
   - Cliquez sur **"Exécuter quand même"**

#### Solution 3: Ajouter une exception dans Windows Defender

1. Ouvrez **Sécurité Windows**
2. Allez dans **Protection contre les virus et menaces**
3. Cliquez sur **Gérer les paramètres**
4. Sous **Exclusions**, cliquez sur **Ajouter ou supprimer des exclusions**
5. Ajoutez le dossier où se trouve l'installateur

---

## ⚠️ Pourquoi ces problèmes?

L'application n'est pas **signée numériquement** avec un certificat officiel:
- **macOS**: Nécessite un compte Apple Developer ($99/an)
- **Windows**: Nécessite un certificat de signature de code (~$200-400/an)

Pour un usage interne ou de développement, les solutions ci-dessus sont suffisantes.

---

## 🔒 Pour les entreprises (Signature de code)

Si vous souhaitez distribuer l'application sans ces avertissements:

### macOS:
- Inscrivez-vous au **Apple Developer Program**
- Configurez les certificats de signature dans le workflow GitHub Actions

### Windows:
- Achetez un **certificat de signature de code**
- Configurez la signature dans le workflow GitHub Actions

Contactez l'équipe de développement pour plus d'informations.

---

## 📞 Support

En cas de problème, contactez l'équipe de développement ou ouvrez une issue sur GitHub.
