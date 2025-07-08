import { ConsoleWriterService } from '@infra/console';
import { MediaSourceDataFormat } from '@modules/media-source';
import { Console, Command } from 'nestjs-console';
import { MediaSourceSyncOptions } from '../types';
import { MediaSourceSyncUc } from '../uc';

@Console({
	command: 'media',
	description: 'Console for accessing various media synchronization operations.',
})
export class MediaSyncConsole {
	constructor(
		private readonly consoleWriter: ConsoleWriterService,
		private readonly mediaSourceSyncUc: MediaSourceSyncUc
	) {}

	@Command({
		command: 'metadata',
		description: 'Start the media metadata synchronization for the specified media source.',
		options: [
			{
				flags: '-df, --dataFormat <value>',
				description: 'Media source data format of the media to be synced',
				required: true,
			},
		],
	})
	public async syncAllMediaMetadata(options: MediaSourceSyncOptions): Promise<void> {
		let verifiedDataFormat: MediaSourceDataFormat;
		if (this.isMediaSourceDataFormatValue(options.dataFormat)) {
			verifiedDataFormat = MediaSourceDataFormat[options.dataFormat];
		} else {
			this.consoleWriter.error(`Unknown media source data format "${options.dataFormat}"`);
			return;
		}

		this.consoleWriter.info(`Media metadata sync started for "${verifiedDataFormat}" media source`);

		await this.mediaSourceSyncUc.syncAllMediaMetadata(options.dataFormat);

		this.consoleWriter.info(`Media metadata sync ended for "${verifiedDataFormat}" media source`);
	}

	@Command({
		command: 'activations',
		description: 'Start the media activations synchronization for the specified media source.',
		options: [
			{
				flags: '-df, --dataFormat <value>',
				description: 'Media source data format of the media to be synced',
				required: true,
			},
		],
	})
	public async syncAllMediaActivations(options: MediaSourceSyncOptions): Promise<void> {
		let verifiedDataFormat: MediaSourceDataFormat;
		if (this.isMediaSourceDataFormatValue(options.dataFormat)) {
			verifiedDataFormat = MediaSourceDataFormat[options.dataFormat];
		} else {
			this.consoleWriter.error(`Unknown media source data format "${options.dataFormat}"`);
			return;
		}

		this.consoleWriter.info(`Media activations sync started for "${verifiedDataFormat}" media source`);

		await this.mediaSourceSyncUc.syncAllMediaActivations(options.dataFormat);

		this.consoleWriter.info(`Media activations sync ended for "${verifiedDataFormat}" media source`);
	}

	private isMediaSourceDataFormatValue(value: string): value is MediaSourceDataFormat {
		return value in MediaSourceDataFormat;
	}
}
