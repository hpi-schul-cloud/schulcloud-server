import { Command, Console } from 'nestjs-console';
import { ConsoleWriterService } from '@infra/console';
import { DeletionExecutionUc } from '../uc';
import { TriggerDeletionExecutionOptions } from './interface';

@Console({ command: 'execution', description: 'Console providing an access to the deletion execution(s).' })
export class DeletionExecutionConsole {
	constructor(private consoleWriter: ConsoleWriterService, private deletionExecutionUc: DeletionExecutionUc) {}

	@Command({
		command: 'trigger',
		description: 'Trigger execution of deletion requests.',
		options: [
			{
				flags: '-l, --limit <value>',
				description: 'Limit of the requested deletion executions that should be performed.',
				required: false,
			},
		],
	})
	async triggerDeletionExecution(options: TriggerDeletionExecutionOptions): Promise<void> {
		const result = await this.deletionExecutionUc.triggerDeletionExecution(
			options.limit ? Number(options.limit) : undefined
		);

		this.consoleWriter.info(JSON.stringify(result));
	}
}
