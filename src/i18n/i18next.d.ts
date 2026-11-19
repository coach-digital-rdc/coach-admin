import 'i18next';

// t() returns a string: a missing text shows its key rather than null
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
