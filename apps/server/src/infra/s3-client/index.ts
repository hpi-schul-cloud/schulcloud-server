/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { GetFile, S3Config } from './interface';
export { S3ClientAdapter } from './s3-client.adapter';
export { S3ClientModule } from './s3-client.module';
