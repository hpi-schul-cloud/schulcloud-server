import { Command, Console } from 'nestjs-console';

@Console({
	command: 'sync',
	description: "Console providing access to the synchronization module's console",
})
export class SynchronizationConsole {
	// constructor() {}

	@Command({
		command: 'system',
		description: 'Synchronize user accounts provisioning system',
		options: [
			{
				flags: '--id <value>',
				description: 'ID of a provisioning system to synchronize',
				required: true,
			},
		],
	})
	async synchronizeSystem(): Promise<void> {}
}
