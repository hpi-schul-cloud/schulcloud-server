import { ConsoleWriterService } from '@infra/console';
import { Command, Console } from 'nestjs-console';
import { DeletionExecutionTriggerResultBuilder } from './builder';
import { DeletionExecutionTriggerResult, TriggerDeletionExecutionOptions } from './interface';
import { DeletionExecutionUc } from './uc';

@Console({ command: 'execution', description: 'Console providing an access to the deletion execution(s).' })
export class DeletionExecutionConsole {
	constructor(private consoleWriter: ConsoleWriterService, private deletionExecutionUc: DeletionExecutionUc) {}

	@Command({
		command: 'trigger',
		description: 'Trigger execution of deletion requests.',
		options: [
			{
				flags: '-l, --limit <value>',
				// TODO implemnt fn with proper command testing
				// fn: (value: string) => (value ? Number(value) : undefined),
				description: 'Limit of the requested deletion executions that should be performed.',
				required: false,
			},
			{
				flags: '-f, --runFailed <value>',
				// TODO implemnt fn with proper command testing
				// fn: (value: string) => /^(true|yes|1)$/i.test(value),
				description: 'Limit of the requested deletion executions that should be performed.',
				required: false,
			},
		],
	})
	public async triggerDeletionExecution(options: TriggerDeletionExecutionOptions): Promise<void> {
		// Try to trigger the deletion execution(s) via Deletion API client,
		// return successful status in case of a success, otherwise return
		// a result with a failure status and a proper error message.
		let result: DeletionExecutionTriggerResult;

		if (typeof options.limit === 'string') {
			options.limit = Number(options.limit);
		}

		if (typeof options.runFailed === 'string') {
			options.runFailed = /^(true|yes|1)$/i.test(options.runFailed);
		}

		try {
			await this.deletionExecutionUc.triggerDeletionExecution(options.limit, options.runFailed);
			result = DeletionExecutionTriggerResultBuilder.buildSuccess();
		} catch (err) {
			result = DeletionExecutionTriggerResultBuilder.buildFailure(err as Error);
		}

		this.consoleWriter.info(JSON.stringify(result));
	}
}
