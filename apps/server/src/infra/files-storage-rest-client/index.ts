/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { FilesStorageClientAdapter } from './files-storage-client.adapter';
export {
	FILES_STORAGE_REST_CLIENT_CONFIG_TOKEN,
	FilesStorageRestClientConfig,
	InternalFilesStorageClientConfig,
} from './files-storage-client.config';
export { FilesStorageRestClientModule } from './files-storage-rest-client.module';
export { FileApi } from './generated/api';
export { FileRecordParentType, FileRecordResponse, StorageLocation } from './generated/models';
export { fileRecordResponseFactory } from './testing';
