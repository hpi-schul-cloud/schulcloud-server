/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { DATABASE_CONFIG_TOKEN, DatabaseConfig } from './database.config';
export { DatabaseModule } from './database.module';
export { DatabaseModuleOptions, InternalDatabaseConfig } from './interfaces';
