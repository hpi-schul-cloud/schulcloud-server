/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { MediumMetadataDto } from './dto';
export { MediumMetadataApiModule } from './medium-metadata-api.module';
export { MediumMetadataModule } from './medium-metadata.module';
export { MediumMetadataService } from './service';
