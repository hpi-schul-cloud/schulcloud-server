import { Loggable } from '@core/logger';
import { LogMessage } from '@core/logger/types';
import { ILibraryInstallResult } from '@lumieducation/h5p-server';

export class H5PLibraryManagementInstallResultsLoggable implements Loggable {
	constructor(private readonly installResult: ILibraryInstallResult[]) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: `Added/updated ${this.installResult.length} libraries from H5P Hub.`,
			data: {
				installResult: this.installResult
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
