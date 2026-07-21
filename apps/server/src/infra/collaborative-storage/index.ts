/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { InternalCollaborativeStorageAdapterConfig } from './collaborative-storage-adapter.config';
export { CollaborativeStorageAdapterModule } from './collaborative-storage-adapter.module';
export { CollaborativeStorageAdapter } from './collaborative-storage.adapter';
export {
	GroupfoldersCreated,
	GroupfoldersFolder,
	GroupUsers,
	Meta,
	NextcloudGroups,
	OcsResponse,
	SuccessfulRes,
} from './strategy/nextcloud/nextcloud.interface';
