import { Loggable } from '@core/logger';
import { LogMessage } from '@core/logger/types';
import { ILibraryAdministrationOverviewItem, ILibraryInstallResult } from '@lumieducation/h5p-server';

export class H5PLibraryManagementMetricsLoggable implements Loggable {
	constructor(
		private readonly availableLibraries: ILibraryAdministrationOverviewItem[],
		private readonly uninstalledLibraries: ILibraryAdministrationOverviewItem[],
		private readonly installedLibraries: ILibraryInstallResult[]
	) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: `Available ${this.availableLibraries.length} libraries. Removed ${this.uninstalledLibraries.length} libraries. Added/updated ${this.installedLibraries.length} libraries.`,
			data: {
				availableLibraries: this.availableLibraries
					.map((lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`)
					.join(', '),
				uninstalledLibraries: this.uninstalledLibraries
					.map((lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`)
					.join(', '),
				installedLibraries: this.installedLibraries
					.map((lib) => {
						let result = '';
						if (lib.type === 'new') {
							result = `${lib.newVersion?.machineName ?? ''}-${lib.newVersion?.majorVersion ?? ''}.${
								lib.newVersion?.minorVersion ?? ''
							}.${lib.newVersion?.patchVersion ?? ''}`;
						}
						if (lib.type === 'patch') {
							result = `${lib.oldVersion?.machineName ?? ''}-${lib.oldVersion?.majorVersion ?? ''}.${
								lib.oldVersion?.minorVersion ?? ''
							}.${lib.oldVersion?.patchVersion ?? ''} -> ${lib.newVersion?.machineName ?? ''}-${
								lib.newVersion?.majorVersion ?? ''
							}.${lib.newVersion?.minorVersion ?? ''}.${lib.newVersion?.patchVersion ?? ''}`;
						}

						return result;
					})
					.join(', '),
			},
		};

		return logMessage;
	}
}
