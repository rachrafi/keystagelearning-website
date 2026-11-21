declare namespace App {
  interface Locals {
    /** The signed-in grown-up, on pages that run on demand. Always null on pre-built pages. */
    user: import('./lib/auth').User | null;
  }
}
