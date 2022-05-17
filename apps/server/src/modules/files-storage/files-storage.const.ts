import { Actions, Permission } from '@shared/domain';

export enum FilesStorageInternalActions {
	downloadBySecurityToken = '/file-security/download/:token',
	updateSecurityStatus = '/file-security/update-status/:token',
}
export const API_VERSION_PATH = '/api/v3';

export enum ErrorType {
	FILE_IS_BLOCKED = 'File is blocked.',
	FILE_NOT_FOUND = 'File not found.',
}

export const PermissionContexts = {
	create: {
		action: Actions.write,
		requiredPermissions: [Permission.FILESTORAGE_CREATE],
	},
	read: {
		action: Actions.read,
		requiredPermissions: [Permission.FILESTORAGE_VIEW],
	},
	update: {
		action: Actions.write,
		requiredPermissions: [Permission.FILESTORAGE_EDIT],
	},
	delete: {
		action: Actions.write,
		requiredPermissions: [Permission.FILESTORAGE_REMOVE],
	},
};
