/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { EncryptionConfig } from './encryption-config.interface';
export { DefaultEncryptionService, EncryptionService } from './encryption.interface';
export { EncryptionModule } from './encryption.module';
export { SymmetricKeyEncryptionService } from './encryption.service';
export { TestEncryptionConfig } from './testing/test-encryption-config';
