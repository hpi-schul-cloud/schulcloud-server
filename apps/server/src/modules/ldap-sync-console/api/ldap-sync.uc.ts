import { Logger } from '@core/logger';
import { runLegacyLdapSync } from '@imports-from-feathers';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { LdapSyncCompletedLoggable, LdapSyncExecutingLoggable, LdapSyncStartedLoggable } from './loggable';

interface SyncStats {
	success: boolean;
	errors: string[];
	systems?: Record<string, unknown>;
}

/**
 * Use case for running LDAP synchronization.
 * This bootstraps the legacy Feathers app and invokes the LDAP sync runner,
 * avoiding the need for HTTP calls or wrapper scripts.
 */
@Injectable()
export class LdapSyncUc {
	constructor(private readonly logger: Logger, private readonly orm: MikroORM) {
		this.logger.setContext(LdapSyncUc.name);
	}

	public async runLdapSync(forceFullSync: boolean): Promise<SyncStats> {
		this.logger.info(new LdapSyncStartedLoggable(forceFullSync));

		this.logger.info(new LdapSyncExecutingLoggable());

		let stats: SyncStats;
		try {
			// Run the LDAP sync using the legacy runner (handles logger creation internally)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
			stats = await runLegacyLdapSync(this.orm, { forceFullSync });
			this.logger.info(new LdapSyncCompletedLoggable(stats));
		} finally {
			// Force process exit after a short delay to allow logs to flush.
			// This is necessary because the legacy Feathers app opens connections
			// (MongoDB, RabbitMQ) that don't get closed and would keep the process alive.
			setTimeout(() => {
				process.exit(0);
			}, 1000);
		}

		return stats;
	}
}
