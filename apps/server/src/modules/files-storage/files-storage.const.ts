import { Permission, PermissionContextBuilder } from '@shared/domain';

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
	create: PermissionContextBuilder.write([Permission.FILESTORAGE_CREATE]),
	read: PermissionContextBuilder.read([Permission.FILESTORAGE_VIEW]),
	update: PermissionContextBuilder.write([Permission.FILESTORAGE_EDIT]),
	delete: PermissionContextBuilder.write([Permission.FILESTORAGE_REMOVE]),
};
