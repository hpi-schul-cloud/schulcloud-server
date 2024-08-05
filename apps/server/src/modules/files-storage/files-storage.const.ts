import { AuthorizationContextBuilder } from '@infra/authorization-client';
import { Permission } from '@shared/domain/interface';

export enum FilesStorageInternalActions {
	downloadBySecurityToken = '/file-security/download/:token',
	updateSecurityStatus = '/file-security/update-status/:token',
}
export const API_VERSION_PATH = '/api/v3';

export const FileStorageAuthorizationContext = {
	create: AuthorizationContextBuilder.write([Permission.FILESTORAGE_CREATE]),
	read: AuthorizationContextBuilder.read([Permission.FILESTORAGE_VIEW]),
	update: AuthorizationContextBuilder.write([Permission.FILESTORAGE_EDIT]),
	delete: AuthorizationContextBuilder.write([Permission.FILESTORAGE_REMOVE]),
};
