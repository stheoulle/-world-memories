import type { Messages } from './en'

/** French UI strings. */
export const fr: Messages = {
  appName: 'World Memories',
  languageLabel: 'Langue',

  // Login
  loginSubtitle: 'Réservé aux membres invités. Saisissez votre e-mail pour recevoir un lien de connexion.',
  email: 'E-mail',
  sendLink: 'Envoyer le lien',
  sending: 'Envoi…',
  linkSent: (email) =>
    `Si ${email} est invitée, un lien de connexion est en route. Ouvrez-le sur cet appareil ou un autre.`,
  useAnotherEmail: 'Utiliser une autre adresse',
  linkInvalid: (reason) => `Ce lien de connexion n’a pas fonctionné (${reason}). Demandez-en un nouveau.`,
  tooManyEmails: 'Trop d’e-mails de connexion envoyés récemment. Réessayez dans une heure.',
  waitAMinute: 'Patientez une minute avant de demander un autre lien.',

  // Profile
  welcome: 'Bienvenue !',
  chooseName: 'Choisissez le nom que les autres membres verront sur vos épingles.',
  displayName: 'Nom affiché',
  continue: 'Continuer',
  saving: 'Enregistrement…',
  profileLoadError: (message) => `Impossible de charger votre profil : ${message}`,
  logOut: 'Se déconnecter',

  // Top bar
  showList: 'Afficher la liste des épingles',
  hideList: 'Masquer la liste des épingles',

  // Sidebar
  filterPins: 'Filtrer les épingles…',
  filterPinsLabel: 'Filtrer les épingles',
  closeList: 'Fermer la liste des épingles',
  pinsLabel: 'Épingles',
  loadingPins: 'Chargement des épingles…',
  pinCount: (n) => (n <= 1 ? `${n} épingle` : `${n} épingles`),
  pinCountFiltered: (shown, total) => `${shown} sur ${total} épingles`,
  noPinsYet: 'Aucune épingle pour l’instant. Cliquez n’importe où sur le globe pour ajouter la première.',
  noMatch: (query) => `Aucune épingle ne correspond à « ${query} ».`,
  exportGeoJson: 'Exporter',
  exportTitle: 'Télécharger les épingles listées dans un fichier GeoJSON',
  couldNotLoadPins: (message) => `Impossible de charger les épingles : ${message}`,

  // Place search
  searchPlace: 'Rechercher un lieu…',
  searchPlaceLabel: 'Rechercher un lieu',
  searching: 'Recherche…',
  searchUnavailable: 'La recherche est indisponible pour le moment.',
  noPlaceFound: 'Aucun lieu trouvé.',

  // Pin form
  newPin: 'Nouvelle épingle',
  editPin: 'Modifier l’épingle',
  location: 'Position',
  pickLocation: 'Cliquez sur le globe pour choisir la nouvelle position…',
  move: 'Déplacer',
  cancel: 'Annuler',
  dragHint: 'Vous pouvez aussi faire glisser l’épingle sur le globe.',
  place: 'Lieu',
  placePlaceholder: 'ex. Kyoto, Japon',
  lookingUpPlace: 'Recherche du lieu…',
  lookUp: 'Retrouver',
  lookUpTitle: 'Remplir le lieu à partir de la position de l’épingle',
  icon: 'Icône',
  changeIcon: (emoji) => `Icône : ${emoji}. Changer`,
  title: 'Titre',
  startDate: 'Date de début',
  endDate: 'Date de fin (facultative)',
  comment: 'Commentaire',
  save: 'Enregistrer',
  titleRequired: 'Le titre est obligatoire.',
  startRequired: 'La date de début est obligatoire.',
  endBeforeStart: 'La date de fin doit être identique ou postérieure à la date de début.',
  discardChanges: 'Abandonner vos modifications non enregistrées ?',

  // Emoji picker
  searchEmoji: 'Rechercher un emoji…',
  loading: 'Chargement…',
  noEmoji: 'Aucun emoji trouvé.',

  // Pin card
  close: 'Fermer',
  addedBy: (name, date) => `Ajoutée par ${name} le ${date}`,
  editedBy: (name, date) => `Modifiée par ${name} le ${date}`,
  formerMember: 'un ancien membre',
  flyTo: 'Y aller',
  delete: 'Supprimer',
  edit: 'Modifier',
  deleteConfirm: 'Supprimer cette épingle pour tout le monde ?',
  keep: 'Garder',
  deleting: 'Suppression…',
}
