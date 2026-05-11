import { Loggable, LogMessage } from '@core/logger';

export class LdapSyncStartedLoggable implements Loggable {
	constructor(private readonly forceFullSync: boolean) {}

	public getLogMessage(): LogMessage {
		return {
			message: `Starting LDAP sync`,
			data: {
				forceFullSync: this.forceFullSync,
			},
		};
	}
}

export class LdapSyncExecutingLoggable implements Loggable {
	public getLogMessage(): LogMessage {
		return {
			message: 'Executing LDAP sync...',
		};
	}
}

export class LdapSyncCompletedLoggable implements Loggable {
	constructor(
		private readonly success: boolean,
		private readonly errorCount: number
	) {}

	public getLogMessage(): LogMessage {
		return {
			message: `LDAP sync completed`,
			data: {
				success: this.success,
				errorCount: this.errorCount,
			},
		};
	}
}
