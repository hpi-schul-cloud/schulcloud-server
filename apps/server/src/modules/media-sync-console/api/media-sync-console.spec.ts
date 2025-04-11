import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConsoleWriterService } from '@infra/console';
import { MediaSourceDataFormat } from '@modules/media-source';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaMetadataSyncOptions } from '../types';
import { MediaMetadataSyncUc } from '../uc';
import { MediaSyncConsole } from './media-sync-console';

describe(MediaSyncConsole.name, () => {
	let module: TestingModule;
	let console: MediaSyncConsole;

	let consoleWriterService: DeepMocked<ConsoleWriterService>;
	let mediaMetadataSyncUc: DeepMocked<MediaMetadataSyncUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSyncConsole,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
				{
					provide: MediaMetadataSyncUc,
					useValue: createMock<MediaMetadataSyncUc>(),
				},
			],
		}).compile();

		console = module.get(MediaSyncConsole);
		consoleWriterService = module.get(ConsoleWriterService);
		mediaMetadataSyncUc = module.get(MediaMetadataSyncUc);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('syncAllMediaMetadata', () => {
		describe('when the options passed have a valid media source data format', () => {
			it('should start the media metadata sync', async () => {
				const dataFormat = MediaSourceDataFormat.VIDIS;
				const options: MediaMetadataSyncOptions = {
					dataFormat: dataFormat.valueOf(),
				};

				await console.syncAllMediaMetadata(options);

				expect(mediaMetadataSyncUc.syncAllMediaMetadata).toBeCalledWith(dataFormat);
			});
		});

		describe('when the options passed have an invalid media source data format', () => {
			it('should not start the media metadata sync', async () => {
				const options: MediaMetadataSyncOptions = {
					dataFormat: 'Vidis',
				};

				await console.syncAllMediaMetadata(options);

				expect(mediaMetadataSyncUc.syncAllMediaMetadata).not.toBeCalled();
			});

			it('should log the invalid data format', async () => {
				const options: MediaMetadataSyncOptions = {
					dataFormat: 'Vidis',
				};

				await console.syncAllMediaMetadata(options);

				expect(consoleWriterService.error).toBeCalledWith(`Unknown media source data format "${options.dataFormat}"`);
			});
		});
	});
});
