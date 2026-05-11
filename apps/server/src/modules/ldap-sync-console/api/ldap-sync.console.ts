import { Console, Command } from 'nestjs-console';
import { ConsoleWriterService } from '@infra/console';
import { LdapSyncUc } from './ldap-sync.uc';

@Console()
export class LdapSyncConsole {
	constructor(
		private readonly consoleWriter: ConsoleWriterService,
		private readonly ldapSyncUc: LdapSyncUc
	) {}

	@Command({
		command: 'sync',
		description: 'Run LDAP synchronization for all active LDAP systems. Defaults to full sync.',
		options: [
			{
				flags: '-d, --deltaSync',
				description: 'Run delta sync instead of full sync.',
				required: false,
				defaultValue: false,
			},
		],
	})
	public async sync(options: { deltaSync: boolean | string }): Promise<void> {
		const forceFullSync = !(options.deltaSync === true || options.deltaSync === 'true');

		this.consoleWriter.info(
			JSON.stringify({
				message: 'Starting LDAP synchronization',
				forceFullSync,
			})
		);

		const stats = await this.ldapSyncUc.runLdapSync(forceFullSync);

		this.consoleWriter.info(
			JSON.stringify({
				message: 'LDAP synchronization finished',
				stats,
			})
		);
	}
}
