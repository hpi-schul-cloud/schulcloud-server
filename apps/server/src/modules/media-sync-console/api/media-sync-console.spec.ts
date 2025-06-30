import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConsoleWriterService } from '@infra/console';
import { MediaSourceDataFormat } from '@modules/media-source';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaSourceSyncOptions } from '../types';
import { MediaSourceSyncUc } from '../uc';
import { MediaSyncConsole } from './media-sync-console';

describe(MediaSyncConsole.name, () => {
	let module: TestingModule;
	let console: MediaSyncConsole;

	let consoleWriterService: DeepMocked<ConsoleWriterService>;
	let mediaSourceSyncUc: DeepMocked<MediaSourceSyncUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaSyncConsole,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
				{
					provide: MediaSourceSyncUc,
					useValue: createMock<MediaSourceSyncUc>(),
				},
			],
		}).compile();

		console = module.get(MediaSyncConsole);
		consoleWriterService = module.get(ConsoleWriterService);
		mediaSourceSyncUc = module.get(MediaSourceSyncUc);
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
				const options: MediaSourceSyncOptions = {
					dataFormat: dataFormat.valueOf(),
				};

				await console.syncAllMediaMetadata(options);

				expect(mediaSourceSyncUc.syncAllMediaMetadata).toBeCalledWith(dataFormat);
			});
		});

		describe('when the options passed have an invalid media source data format', () => {
			it('should not start the media metadata sync', async () => {
				const options: MediaSourceSyncOptions = {
					dataFormat: 'Vidis',
				};

				await console.syncAllMediaMetadata(options);

				expect(mediaSourceSyncUc.syncAllMediaMetadata).not.toBeCalled();
			});

			it('should log the invalid data format', async () => {
				const options: MediaSourceSyncOptions = {
					dataFormat: 'bi lo',
				};

				await console.syncAllMediaMetadata(options);

				expect(consoleWriterService.error).toBeCalledWith(`Unknown media source data format "${options.dataFormat}"`);
			});
		});
	});

	describe('syncAllMediaActivations', () => {
		describe('when the options passed have a valid media source data format', () => {
			it('should start the media activations sync', async () => {
				const dataFormat = MediaSourceDataFormat.VIDIS;
				const options: MediaSourceSyncOptions = {
					dataFormat: dataFormat.valueOf(),
				};

				await console.syncAllMediaActivations(options);

				expect(mediaSourceSyncUc.syncAllMediaActivations).toBeCalledWith(dataFormat);
			});
		});

		describe('when the options passed have an invalid media source data format', () => {
			it('should not start the media activations sync', async () => {
				const options: MediaSourceSyncOptions = {
					dataFormat: 'viDis',
				};

				await console.syncAllMediaActivations(options);

				expect(mediaSourceSyncUc.syncAllMediaActivations).not.toBeCalled();
			});

			it('should log the invalid data format', async () => {
				const options: MediaSourceSyncOptions = {
					dataFormat: 'unknown',
				};

				await console.syncAllMediaActivations(options);

				expect(consoleWriterService.error).toBeCalledWith(`Unknown media source data format "${options.dataFormat}"`);
			});
		});
	});
});
