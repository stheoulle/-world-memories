/** English UI strings. `fr.ts` must provide the same keys (enforced by its type). */
export const en = {
  appName: 'World Memories',
  languageLabel: 'Language',

  // Login
  loginSubtitle: 'Invited members only. Enter your email to receive a login link.',
  email: 'Email',
  sendLink: 'Send login link',
  sending: 'Sending…',
  linkSent: (email: string) => `If ${email} is invited, a login link is on its way. Open it on this device or any other.`,
  useAnotherEmail: 'Use another email',
  linkInvalid: (reason: string) => `This login link did not work (${reason}). Request a new one.`,
  tooManyEmails: 'Too many login emails were sent recently. Please try again in an hour.',
  waitAMinute: 'Please wait a minute before requesting another link.',

  // Profile
  welcome: 'Welcome!',
  chooseName: 'Choose the name other members will see on your pins.',
  displayName: 'Display name',
  continue: 'Continue',
  saving: 'Saving…',
  profileLoadError: (message: string) => `Could not load your profile: ${message}`,
  logOut: 'Log out',

  // Top bar
  showList: 'Show the pin list',
  hideList: 'Hide the pin list',

  // Sidebar
  filterPins: 'Filter pins…',
  filterPinsLabel: 'Filter pins',
  closeList: 'Close the pin list',
  pinsLabel: 'Pins',
  loadingPins: 'Loading pins…',
  pinCount: (n: number) => (n === 1 ? '1 pin' : `${n} pins`),
  pinCountFiltered: (shown: number, total: number) => `${shown} of ${total} pins`,
  noPinsYet: 'No pins yet. Click anywhere on the globe to add the first one.',
  noMatch: (query: string) => `No pin matches “${query}”.`,
  exportGeoJson: 'Export',
  exportTitle: 'Download the listed pins as a GeoJSON file',
  couldNotLoadPins: (message: string) => `Could not load pins: ${message}`,

  // Place search
  searchPlace: 'Search a place…',
  searchPlaceLabel: 'Search a place',
  searching: 'Searching…',
  searchUnavailable: 'Search is unavailable right now.',
  noPlaceFound: 'No place found.',

  // Pin form
  newPin: 'New pin',
  editPin: 'Edit pin',
  location: 'Location',
  pickLocation: 'Click on the globe to choose a new location…',
  move: 'Move',
  cancel: 'Cancel',
  dragHint: 'You can also drag the pin on the globe.',
  place: 'Place',
  placePlaceholder: 'e.g. Kyoto, Japan',
  lookingUpPlace: 'Looking up the place…',
  lookUp: 'Look up',
  lookUpTitle: "Fill in the place from the pin's location",
  icon: 'Icon',
  changeIcon: (emoji: string) => `Icon: ${emoji}. Change`,
  title: 'Title',
  startDate: 'Start date',
  endDate: 'End date (optional)',
  comment: 'Comment',
  save: 'Save',
  titleRequired: 'A title is required.',
  startRequired: 'A start date is required.',
  endBeforeStart: 'The end date must be on or after the start date.',
  discardChanges: 'Discard your unsaved changes?',

  // Emoji picker
  searchEmoji: 'Search emoji…',
  loading: 'Loading…',
  noEmoji: 'No emoji found.',

  // Pin card
  close: 'Close',
  addedBy: (name: string, date: string) => `Added by ${name} on ${date}`,
  editedBy: (name: string, date: string) => `Edited by ${name} on ${date}`,
  formerMember: 'a former member',
  flyTo: 'Fly to',
  delete: 'Delete',
  edit: 'Edit',
  deleteConfirm: 'Delete this pin for everyone?',
  keep: 'Keep',
  deleting: 'Deleting…',
}

export type Messages = typeof en
