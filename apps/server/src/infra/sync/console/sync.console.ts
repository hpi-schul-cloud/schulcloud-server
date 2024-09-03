import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { ConsoleWriterService } from '@infra/console';
import { SyncUc } from '../uc/sync.uc';

@Console({ command: 'sync', description: 'Prefixes all synchronization related console commands.' })
export class SyncConsole {
	constructor(
		private consoleWriter: ConsoleWriterService,
		private readonly syncUc: SyncUc,
		private readonly logger: Logger
	) {
		this.logger.setContext(SyncConsole.name);
	}

	// add promise and await to the method
	@Command({
		command: 'start <target>',
		description: 'Starts the synchronization process.',
	})
	async startSync(target: string): Promise<void> {
		await this.syncUc.startSync(target);
	}
}
