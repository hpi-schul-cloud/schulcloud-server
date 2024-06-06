import { Permission } from '@shared/domain/interface';
import { Action, AuthorizationContext } from '../../authorization';
import { StorageLocation } from '../entity';
import { FileStorageAuthorizationContext } from './files-storage-authorization';

describe(FileStorageAuthorizationContext.name, () => {
	describe('create', () => {
		describe('when the storage location is school', () => {
			it('should return the required authorization context for school', () => {
				expect(FileStorageAuthorizationContext.create(StorageLocation.SCHOOL)).toEqual<AuthorizationContext>({
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_WRITE_SCHOOL, Permission.FILESTORAGE_CREATE],
				});
			});
		});

		describe('when the storage location is instance', () => {
			it('should return the required authorization context for instance', () => {
				expect(FileStorageAuthorizationContext.create(StorageLocation.INSTANCE)).toEqual<AuthorizationContext>({
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_WRITE_INSTANCE, Permission.FILESTORAGE_CREATE],
				});
			});
		});
	});

	describe('read', () => {
		it('should return the required authorization context for school', () => {
			expect(FileStorageAuthorizationContext.read()).toEqual<AuthorizationContext>({
				action: Action.read,
				requiredPermissions: [Permission.FILESTORAGE_VIEW],
			});
		});
	});

	describe('update', () => {
		describe('when the storage location is school', () => {
			it('should return the required authorization context for school', () => {
				expect(FileStorageAuthorizationContext.update(StorageLocation.SCHOOL)).toEqual<AuthorizationContext>({
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_WRITE_SCHOOL, Permission.FILESTORAGE_EDIT],
				});
			});
		});

		describe('when the storage location is instance', () => {
			it('should return the required authorization context for instance', () => {
				expect(FileStorageAuthorizationContext.update(StorageLocation.INSTANCE)).toEqual<AuthorizationContext>({
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_WRITE_INSTANCE, Permission.FILESTORAGE_EDIT],
				});
			});
		});
	});

	describe('update', () => {
		describe('when the storage location is school', () => {
			it('should return the required authorization context for school', () => {
				expect(FileStorageAuthorizationContext.delete(StorageLocation.SCHOOL)).toEqual<AuthorizationContext>({
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_WRITE_SCHOOL, Permission.FILESTORAGE_REMOVE],
				});
			});
		});

		describe('when the storage location is instance', () => {
			it('should return the required authorization context for instance', () => {
				expect(FileStorageAuthorizationContext.delete(StorageLocation.INSTANCE)).toEqual<AuthorizationContext>({
					action: Action.write,
					requiredPermissions: [Permission.FILESTORAGE_WRITE_INSTANCE, Permission.FILESTORAGE_REMOVE],
				});
			});
		});
	});
});
