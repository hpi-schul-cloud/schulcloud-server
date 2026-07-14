/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { ErwinIdentifier } from './domain/do';
export { ErwinIdentifierService } from './domain/service';
export { ErwinIdentifierModule } from './erwin-identifier.module';
export { ReferencedEntityType } from './types';
