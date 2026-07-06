import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class LdapSyncStartedLoggable implements Loggable {
	constructor(private readonly forceFullSync: boolean) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: `Starting LDAP sync`,
			data: {
				forceFullSync: this.forceFullSync,
			},
		};
	}
}

export class LdapSyncExecutingLoggable implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			message: 'Executing LDAP sync...',
		};
	}
}

interface SyncStats {
	success: boolean;
	errors: string[];
}

export class LdapSyncCompletedLoggable implements Loggable {
	constructor(private readonly stats: SyncStats) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: `LDAP sync completed`,
			data: {
				success: this.stats.success,
				errorCount: this.stats.errors.length,
			},
		};
	}
}
