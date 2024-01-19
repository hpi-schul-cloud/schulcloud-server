/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Console, Command } from 'nestjs-console';
import { ConsoleWriterService } from '@infra/console';
import { PushDeletionRequestsOptions } from './interface';
import { BatchDeletionUc } from './uc';

@Console({ command: 'queue', description: 'Console providing an access to the deletion queue.' })
export class DeletionQueueConsole {
	constructor(private consoleWriter: ConsoleWriterService, private batchDeletionUc: BatchDeletionUc) {}

	@Command({
		command: 'push',
		description: 'Push new deletion requests to the deletion queue.',
		options: [
			{
				flags: '-rfp, --refsFilePath <value>',
				description: 'Path of the file containing all the references to the data that should be deleted.',
				required: true,
			},
			{
				flags: '-trd, --targetRefDomain <value>',
				description: 'Name of the target ref domain.',
				required: false,
			},
			{
				flags: '-dim, --deleteInMinutes <value>',
				description: 'Number of minutes after which the data deletion process should begin.',
				required: false,
			},
			{
				flags: '-cdm, --callsDelayMs <value>',
				description: 'Delay between all the performed client calls, in milliseconds.',
				required: false,
			},
		],
	})
	async pushDeletionRequests(options: PushDeletionRequestsOptions): Promise<void> {
		const summary = await this.batchDeletionUc.deleteRefsFromTxtFile(
			options.refsFilePath,
			options.targetRefDomain,
			options.deleteInMinutes ? Number(options.deleteInMinutes) : undefined,
			options.callsDelayMs ? Number(options.callsDelayMs) : undefined
		);

		this.consoleWriter.info(JSON.stringify(summary));
	}
}
