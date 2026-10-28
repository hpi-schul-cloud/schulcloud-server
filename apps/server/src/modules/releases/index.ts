/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { ReleaseEntity } from './entity';
export { RELEASES_CONFIG_TOKEN, ReleasesConfig } from './releases.config';
export { ReleasesApiModule } from './releases-api.module';
export { ReleasesModule } from './releases.module';
