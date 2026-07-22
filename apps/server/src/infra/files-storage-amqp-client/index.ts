/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { CopyFileDto, FileDto } from './dto';
export {
	FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
	FilesStorageAMQPClientConfig,
} from './files-storage-amqp-client-config';
export { FilesStorageAMQPClientModule } from './files-storage-amqp-client.module';
export {
	CopyFilesRequestInfo,
	FileDO,
	FileRecordParentType,
	FileRequestInfo,
	ScanStatus,
	StorageLocation,
} from './interfaces';
export { FilesStorageClientAdapterService } from './service';
