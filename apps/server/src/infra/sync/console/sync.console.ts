import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { SyncUc } from '../uc/sync.uc';

@Console({ command: 'sync', description: 'Prefixes all synchronization related console commands.' })
export class SyncConsole {
	constructor(private readonly syncUc: SyncUc, private readonly logger: Logger) {
		this.logger.setContext(SyncConsole.name);
	}

	@Command({
		command: 'run <target>',
		description: 'Starts the synchronization process.',
	})
	public async startSync(target: string): Promise<void> {
		await this.syncUc.startSync(target);
	}
}
