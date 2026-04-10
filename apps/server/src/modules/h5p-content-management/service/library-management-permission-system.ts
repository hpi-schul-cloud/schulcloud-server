/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ContentPermission,
	GeneralPermission,
	IPermissionSystem,
	IUser,
	TemporaryFilePermission,
	UserDataPermission,
} from '@lumieducation/h5p-server';

export default class LibraryManagementPermissionSystem implements IPermissionSystem<IUser> {
	checkForUserData(
		actingUser: IUser,
		permission: UserDataPermission,
		contentId: string,
		affectedUserId?: string
	): Promise<boolean> {
		return Promise.resolve(false);
	}

	async checkForContent(
		actingUser: IUser | undefined,
		permission: ContentPermission,
		contentId?: string
	): Promise<boolean> {
		return Promise.resolve(false);
	}

	async checkForTemporaryFile(
		user: IUser | undefined,
		permission: TemporaryFilePermission,
		filename?: string
	): Promise<boolean> {
		return Promise.resolve(false);
	}

	async checkForGeneralAction(actingUser: IUser | undefined, permission: GeneralPermission): Promise<boolean> {
		switch (permission) {
			case GeneralPermission.InstallRecommended:
				return Promise.resolve(true);
			case GeneralPermission.UpdateAndInstallLibraries:
				return Promise.resolve(true);
			case GeneralPermission.CreateRestricted:
				return Promise.resolve(true);
			default:
				return false;
		}
	}
}
