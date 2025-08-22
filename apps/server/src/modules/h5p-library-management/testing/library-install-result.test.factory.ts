import { ILibraryInstallResult } from '@lumieducation/h5p-server';
import { IFullLibraryName } from '@lumieducation/h5p-server/build/src/types';

export class ILibraryInstallResultTestFactory {
	public static create(
		type: 'new' | 'patch' | 'none',
		newVersion?: IFullLibraryName,
		oldVersion?: IFullLibraryName
	): ILibraryInstallResult {
		return {
			type,
			newVersion,
			oldVersion,
		};
	}
}
