/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { OfferDTO, PageOfferDTO, SchoolActivationDTO } from './generated';
export { vidisOfferItemFactory, vidisPageOfferFactory } from './testing';
export { VidisClientAdapter } from './vidis-client.adapter';
export { VidisClientModule } from './vidis-client.module';
