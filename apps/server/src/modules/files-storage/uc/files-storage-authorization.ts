import { Permission } from '@shared/domain/interface';
import { AuthorizationContext, AuthorizationContextBuilder } from '../../authorization';
import { StorageLocation } from '../entity';

export class FileStorageAuthorizationContext {
	private static getStorageLocationPermission(storageLocation: StorageLocation): Permission {
		if (storageLocation === StorageLocation.INSTANCE) {
			return Permission.FILESTORAGE_WRITE_INSTANCE;
		}

		return Permission.FILESTORAGE_WRITE_SCHOOL;
	}

	static create(storageLocation: StorageLocation): AuthorizationContext {
		return AuthorizationContextBuilder.write([
			this.getStorageLocationPermission(storageLocation),
			Permission.FILESTORAGE_CREATE,
		]);
	}

	static read(): AuthorizationContext {
		return AuthorizationContextBuilder.read([Permission.FILESTORAGE_VIEW]);
	}

	static update(storageLocation: StorageLocation): AuthorizationContext {
		return AuthorizationContextBuilder.write([
			this.getStorageLocationPermission(storageLocation),
			Permission.FILESTORAGE_EDIT,
		]);
	}

	static delete(storageLocation: StorageLocation): AuthorizationContext {
		return AuthorizationContextBuilder.write([
			this.getStorageLocationPermission(storageLocation),
			Permission.FILESTORAGE_REMOVE,
		]);
	}
}
