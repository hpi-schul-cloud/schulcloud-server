import { ILibraryAdministrationOverviewItem } from '@lumieducation/h5p-server';

export class ILibraryAdministrationOverviewItemTestFactory {
	public static create(partial: Partial<ILibraryAdministrationOverviewItem> = {}): ILibraryAdministrationOverviewItem {
		return {
			canBeDeleted: partial.canBeDeleted ?? true,
			canBeUpdated: partial.canBeUpdated ?? true,
			dependentsCount: partial.dependentsCount ?? 0,
			instancesAsDependencyCount: partial.instancesAsDependencyCount ?? 0,
			instancesCount: partial.instancesCount ?? 0,
			isAddon: partial.isAddon ?? false,
			machineName: partial.machineName ?? '',
			majorVersion: partial.majorVersion ?? 1,
			minorVersion: partial.minorVersion ?? 1,
			patchVersion: partial.patchVersion ?? 1,
			restricted: partial.restricted ?? false,
			runnable: partial.runnable ?? true,
			title: partial.title ?? '',
		};
	}
}
