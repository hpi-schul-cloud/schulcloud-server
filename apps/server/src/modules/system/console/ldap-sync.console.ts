import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';

@Console({ command: 'ldap-sync', description: 'ldap sync console' })
export class LdapSyncConsole {
	constructor(private readonly feathersServiceProvider: FeathersServiceProvider, private logger: Logger) {}

	@Command({
		command: 'force-full-sync',
		description: 'runs a full ldap sync',
	})
	async fullLdapSync(): Promise<void> {
		const ldapServiceData = {
			target: 'ldap',
			forceFullSync: true,
		};
		try {
			const service = this.feathersServiceProvider.getService('/sync');
			this.logger.log('Starting full ldap sync');

			const result = (await service.find(ldapServiceData)) as Promise<string>;
			this.logger.log(result);
			this.logger.log('Full ldap sync ended');
		} catch (error) {
			this.logger.error('Could not complete ldap full sync', error);
		}
	}
}
