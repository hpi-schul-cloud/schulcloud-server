import { Console, Command } from 'nestjs-console';
import { ConsoleWriterService } from '@infra/console';
import { SynchronizationUc } from '@modules/synchronization';
import { UsersSyncOptions, SystemType } from './interface';

@Console({
	command: 'sync',
	description: 'Console providing an access to the IDP-provisioned data synchronization operations.',
})
export class IdpSyncConsole {
	constructor(private consoleWriter: ConsoleWriterService, private synchronizationUc: SynchronizationUc) {}

	@Command({
		command: 'users',
		description: 'Synchronize IDP-provisioned users.',
		options: [
			{
				flags: '-st, --systemType <value>',
				description: 'Type of a synchronized system.',
				required: true,
			},
			{
				flags: '-si, --systemId <value>',
				description: 'ID of a synchronized system.',
				required: true,
			},
		],
	})
	async users(options: UsersSyncOptions): Promise<void> {
		if (options.systemType !== SystemType.MOIN_SCHULE) {
			throw new Error(`invalid system type (currently the only supported system type is "${SystemType.MOIN_SCHULE}")`);
		}

		this.consoleWriter.info(
			JSON.stringify({
				message: 'starting synchronization',
				options,
			})
		);

		await this.synchronizationUc.updateSystemUsersLastSyncedAt(options.systemId);

		this.consoleWriter.info(
			JSON.stringify({
				message: 'successfully finished synchronization',
				options,
			})
		);
	}
}
