import {
	ContentPermission,
	GeneralPermission,
	TemporaryFilePermission,
	UserDataPermission,
} from '@lumieducation/h5p-server';
import LibraryManagementPermissionSystem from './library-management-permission-system';

describe('LibraryManagementPermissionSystem', () => {
	const buildUser = () => {
		return { id: '1', email: '', name: '', type: '' };
	};

	describe('checkForUserData', () => {
		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.DeleteFinished, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.DeleteState, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.EditFinished, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.EditState, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.ListStates, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.ViewFinished, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForUserData(user, UserDataPermission.ViewState, '1');

			expect(result).toBe(false);
		});
	});

	describe('checkForContent', () => {
		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.Create, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.Delete, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.Download, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.Edit, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.Embed, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.List, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForContent(user, ContentPermission.View, '1');

			expect(result).toBe(false);
		});
	});

	describe('checkForTemporaryFile', () => {
		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForTemporaryFile(user, TemporaryFilePermission.Create, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForTemporaryFile(user, TemporaryFilePermission.Delete, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForTemporaryFile(user, TemporaryFilePermission.List, '1');

			expect(result).toBe(false);
		});

		it('should return false', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForTemporaryFile(user, TemporaryFilePermission.View, '1');

			expect(result).toBe(false);
		});
	});

	describe('checkForGeneralAction', () => {
		it('should return true', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForGeneralAction(user, GeneralPermission.InstallRecommended);

			expect(result).toBe(true);
		});

		it('should return true', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForGeneralAction(user, GeneralPermission.UpdateAndInstallLibraries);

			expect(result).toBe(true);
		});

		it('should return true', async () => {
			const user = buildUser();

			const permissionSystem = new LibraryManagementPermissionSystem();
			const result = await permissionSystem.checkForGeneralAction(user, GeneralPermission.CreateRestricted);

			expect(result).toBe(true);
		});
	});
});
