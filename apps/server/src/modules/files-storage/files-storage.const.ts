import {
	AuthorizationContextBuilder,
	AuthorizationContextParamsRequiredPermissions,
} from '@infra/authorization-client';

export enum FilesStorageInternalActions {
	downloadBySecurityToken = '/file-security/download/:token',
	updateSecurityStatus = '/file-security/update-status/:token',
}
export const API_VERSION_PATH = '/api/v3';

export const FileStorageAuthorizationContext = {
	create: AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_CREATE]),
	read: AuthorizationContextBuilder.read([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_VIEW]),
	update: AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_EDIT]),
	delete: AuthorizationContextBuilder.write([AuthorizationContextParamsRequiredPermissions.FILESTORAGE_REMOVE]),
};
