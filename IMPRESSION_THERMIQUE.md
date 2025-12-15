# Guide d'impression thermique

## Vue d'ensemble

Le système d'impression thermique permet d'imprimer des tickets, reçus et bordereaux sur des imprimantes thermiques standard (58mm ou 80mm) avec support de:
- Logos et images
- Mise en forme du texte (gras, tailles différentes)
- Alignements (gauche, centre, droite)
- Coupure automatique du papier

## Architecture

### Composants Rust (Backend)

**Fichier**: `src-tauri/src/printer.rs`

Le module Rust contient:
- Commandes ESC/POS pour le formatage
- Conversion d'images en bitmap pour l'impression
- Génération de tickets formatés
- Communication avec l'imprimante via le système de fichiers

#### Commandes Tauri disponibles:

```rust
print_ticket(printer_name: String, ticket_data: TicketData, logo_base64: Option<String>)
list_printers() -> Vec<String>
print_raw_data(printer_name: String, data: Vec<u8>)
```

### Service TypeScript (Frontend)

**Fichier**: `src/services/printer.ts`

La classe `ThermalPrinter` fournit des méthodes faciles à utiliser:

```typescript
// Lister les imprimantes
await ThermalPrinter.listPrinters()

// Imprimer un ticket
await ThermalPrinter.printTicket(printerName, ticketData, logoBase64)

// Convertir une image en base64
await ThermalPrinter.imageToBase64(file)
```

La classe `TicketBuilder` offre des templates prêts à l'emploi:

```typescript
// Ticket de transport
TicketBuilder.createTransportTicket({...})

// Reçu de colis
TicketBuilder.createParcelReceipt({...})

// Bordereau
TicketBuilder.createManifest({...})
```

## Configuration des imprimantes

### Windows
Nom exact de l'imprimante tel qu'affiché dans les paramètres Windows (ex: `POS-80`, `Thermal Printer`, `XP-58`, etc.)

**Important**: L'application utilise l'API Windows native pour l'impression RAW, ce qui garantit que les commandes ESC/POS sont envoyées directement à l'imprimante sans interprétation par le spooler Windows.

### macOS
Chemin: Nom CUPS de l'imprimante (ex: `thermal_printer`)

### Linux
Chemin: `/dev/usb/lp0`, `/dev/usb/lp1`, etc.

## Utilisation

### 1. Page de test

Accédez à **Administration > Test Imprimante** pour:
- Sélectionner votre imprimante
- Uploader un logo (optionnel)
- Tester différents types de tickets

### 2. Intégration dans votre code

#### Exemple: Imprimer un ticket de transport

```typescript
import { ThermalPrinter, TicketBuilder } from '../services/printer';

const imprimerTicket = async () => {
  try {
    // Créer les données du ticket
    const ticketData = TicketBuilder.createTransportTicket({
      ticketNumber: 'TK-001',
      passenger: 'Jean Dupont',
      destination: 'Paris',
      seatNumber: '12A',
      date: new Date().toLocaleDateString(),
      time: '14:30',
      price: '50 EUR',
    });

    // Optionnel: Charger un logo
    const logo = await ThermalPrinter.urlToBase64('/logo.png');

    // Imprimer
    await ThermalPrinter.printTicket('USB001', ticketData, logo);

    console.log('Ticket imprimé avec succès!');
  } catch (error) {
    console.error('Erreur d\'impression:', error);
  }
};
```

#### Exemple: Créer un ticket personnalisé

```typescript
import { ThermalPrinter, TicketData } from '../services/printer';

const ticketData: TicketData = {
  title: 'MON TICKET',
  items: [
    { label: 'Article 1', value: '10 EUR' },
    { label: 'Article 2', value: '20 EUR' },
  ],
  total: 'TOTAL: 30 EUR',
  footer: [
    'Merci de votre visite',
    'www.example.com',
    new Date().toLocaleString(),
  ],
};

await ThermalPrinter.printTicket('USB001', ticketData);
```

## Commandes ESC/POS

Le système utilise les commandes ESC/POS standard:

| Commande | Description |
|----------|-------------|
| `INIT` | Initialiser l'imprimante |
| `ALIGN_LEFT` | Aligner à gauche |
| `ALIGN_CENTER` | Centrer le texte |
| `ALIGN_RIGHT` | Aligner à droite |
| `TEXT_NORMAL` | Texte normal |
| `TEXT_BOLD` | Texte en gras |
| `TEXT_LARGE` | Texte agrandi (double hauteur + largeur) |
| `CUT_PAPER` | Couper le papier |
| `LINE_FEED` | Saut de ligne |

## Format d'image

Les logos sont automatiquement:
- Convertis en niveaux de gris
- Redimensionnés à 200px de largeur
- Transformés en bitmap pour l'impression
- Centrés sur le ticket

Formats supportés: JPEG, PNG, BMP, GIF

## Dépannage

### L'imprimante n'est pas détectée

**Windows**:
- Vérifiez que l'imprimante est connectée et allumée
- Allez dans **Paramètres > Périphériques > Imprimantes et scanners**
- Utilisez le nom **exact** de l'imprimante tel qu'affiché (sensible à la casse)
- Assurez-vous que l'imprimante est définie comme imprimante locale (pas réseau)
- Pour les imprimantes USB, installez les pilotes du fabricant si nécessaire

**macOS**:
- Utilisez `lpstat -p` dans le Terminal pour lister les imprimantes
- Installez les pilotes CUPS si nécessaire

**Linux**:
- Vérifiez `/dev/usb/` pour les imprimantes USB
- Assurez-vous d'avoir les permissions d'accès (`sudo usermod -a -G lp $USER`)

### Rien ne s'imprime

1. Vérifiez que l'imprimante a du papier
2. Vérifiez les permissions d'accès au périphérique
3. Testez avec un autre logiciel pour valider le matériel
4. Consultez les logs dans la console de l'application

### Windows: Impression bloquée sur "Page x sur document" (RÉSOLU)

**Symptôme**: L'impression affiche "Page x sur document" avec x qui s'incrémente indéfiniment, mais rien ne sort de l'imprimante.

**Cause**: Ce problème était causé par l'utilisation de PowerShell `Out-Printer` qui interprétait les données ESC/POS comme du texte au lieu de les envoyer en mode RAW.

**Solution implémentée**: L'application utilise désormais l'API Windows native (`WritePrinter`) avec le type de données "RAW", ce qui garantit que les commandes ESC/POS sont envoyées directement à l'imprimante sans interprétation.

**Si le problème persiste**:
1. Vérifiez que le nom de l'imprimante est correct
2. Assurez-vous que l'imprimante supporte l'impression RAW (la plupart des imprimantes thermiques le supportent)
3. Vérifiez les pilotes de l'imprimante (installez les pilotes ESC/POS génériques si nécessaire)
4. Consultez les logs de l'application pour plus de détails

### Le logo ne s'affiche pas

1. Vérifiez que l'image est au format supporté (JPEG, PNG)
2. Essayez avec une image plus petite (<500KB)
3. Vérifiez que l'image n'est pas corrompue

### La coupure de papier ne fonctionne pas

Certaines imprimantes nécessitent une commande spécifique:
- Utilisez `CUT_PARTIAL` au lieu de `CUT_PAPER`
- Vérifiez le manuel de votre imprimante

## Personnalisation avancée

### Créer un template personnalisé

```typescript
export class CustomTicketBuilder {
  static createInvoice(data: any): TicketData {
    return {
      title: 'FACTURE',
      items: [
        { label: 'N° Facture', value: data.invoiceNumber },
        { label: 'Client', value: data.customerName },
        { label: 'Date', value: data.date },
        { label: '', value: '' },
        { label: '--- ARTICLES ---', value: '' },
        ...data.items.map((item: any) => ({
          label: item.name,
          value: `${item.quantity} x ${item.price}`,
        })),
      ],
      total: `TOTAL: ${data.total}`,
      footer: [
        'TVA incluse',
        'Paiement: ' + data.paymentMethod,
        'Merci pour votre achat',
      ],
    };
  }
}
```

### Envoyer des commandes brutes

Si vous avez besoin d'un contrôle total:

```typescript
// Commandes ESC/POS brutes
const commands = [
  0x1B, 0x40, // INIT
  0x1B, 0x61, 0x01, // CENTER
  ...Array.from(new TextEncoder().encode('Hello World')),
  0x0A, // LINE FEED
  0x1D, 0x56, 0x41, 0x00, // CUT
];

await ThermalPrinter.printRawData('USB001', commands);
```

## Exemples de mise en page

### Ticket simple
```
        ┌─────────────────┐
        │   [LOGO]        │
        │                 │
        │  TICKET VOYAGE  │
        │                 │
        │ --------------- │
        │                 │
        │ Passager: Jean  │
        │ Destination: NY │
        │ Siège: 12A      │
        │                 │
        │     TOTAL: 50€  │
        │                 │
        │  Bon voyage!    │
        │  12/01/2025     │
        └─────────────────┘
```

## Dépendances

### Rust
- `image = "0.24"` - Traitement d'images
- `base64 = "0.21"` - Décodage base64
- `windows = "0.58"` (Windows uniquement) - API Windows native pour l'impression RAW
  - Features utilisées:
    - `Win32_Foundation` - Types de base Windows
    - `Win32_Graphics_Printing` - API d'impression
    - `Win32_Storage_FileSystem` - Gestion des fichiers

### TypeScript
- `@tauri-apps/api` - Communication avec Rust
- `@tauri-apps/plugin-http` - Téléchargement d'images depuis URLs

## Licence et support

Ce système d'impression est intégré à l'application Fast Transport & Logistique.

Pour toute question ou problème:
1. Consultez ce guide
2. Vérifiez les logs de l'application
3. Testez avec la page **Test Imprimante**

## Ressources

- [ESC/POS Command Guide](https://reference.epson-biz.com/modules/ref_escpos/)
- [Tauri Documentation](https://tauri.app/)
- [Image Processing in Rust](https://docs.rs/image/)
