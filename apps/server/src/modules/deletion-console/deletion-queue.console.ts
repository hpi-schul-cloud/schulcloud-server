/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Console, Command, CommandOption } from 'nestjs-console';
import { ConsoleWriterService } from '@infra/console';
import { PushDeletionRequestsOptions, UnsyncedEntitiesOptions } from './interface';
import { BatchDeletionUc } from './uc';

const sharedCommandOptions: CommandOption[] = [
	{
		flags: '-trd, --targetRefDomain <value>',
		description: 'Name of the target ref domain.',
		required: false,
		defaultValue: 'user',
	},
	{
		flags: '-dim, --deleteInMinutes <value>',
		description: 'Number of minutes after which the data deletion process should begin.',
		required: false,
		defaultValue: 43200, // 43200 minutes = 30 days
	},
	{
		flags: '-cdm, --callsDelayMs <value>',
		description: 'Delay between all the performed client calls, in milliseconds.',
		required: false,
	},
];

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
			...sharedCommandOptions,
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

	@Command({
		command: 'unsynced',
		description: 'Finds unsynchronized users and queue them for deletion.',
		options: [
			{
				flags: '-si, --systemId <value>',
				description: 'ID of a synchronized system.',
				required: true,
			},
			{
				flags: '-ufm, --unsyncedForMinutes <value>',
				description:
					'Number of minutes that must have passed before entity can be considered unsynchronized. Minimum value: 60.',
				required: false,
				defaultValue: 10080, // 10080 minutes = 7 days
			},
			...sharedCommandOptions,
		],
	})
	async unsyncedEntities(options: UnsyncedEntitiesOptions): Promise<void> {
		if (options.unsyncedForMinutes < 60) {
			throw new Error(`invalid "unsyncedForMinutes" option value - minimum value is 60`);
		}

		this.consoleWriter.info(
			JSON.stringify({ message: 'starting queueing unsynchronized entities for deletion', options })
		);

		const summary = await this.batchDeletionUc.deleteUnsynchronizedRefs(
			options.systemId,
			options.unsyncedForMinutes,
			options.targetRefDomain,
			options.deleteInMinutes,
			options.callsDelayMs
		);

		this.consoleWriter.info(
			JSON.stringify({ message: 'successfully finished queueing unsynchronized entities for deletion', summary })
		);
	}
}
