import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import fs from 'fs';
import { PushDeleteRequestsOptionsBuilder } from './builder';
import { UnsyncedEntitiesOptionsBuilder } from './builder/unsynced-entities-options.builder';
import { DeletionConsoleTestModule } from './deletion-console.app.module';
import { DELETION_CONSOLE_CONFIG_TOKEN } from './deletion-console.config';
import { DeletionQueueConsole } from './deletion-queue.console';
import { BatchDeletionUc } from './uc';

describe(DeletionQueueConsole.name, () => {
	let module: TestingModule;
	let console: DeletionQueueConsole;
	let batchDeletionUc: BatchDeletionUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [DeletionConsoleTestModule],
		})
			.overrideProvider(DELETION_CONSOLE_CONFIG_TOKEN)
			.useValue({
				adminApiClientBaseUrl: 'http://api-admin:4030',
				adminApiClientApiKey: '652559c2-93da-42ad-94e1-640e3afbaca0',
			})
			.compile();

		console = module.get(DeletionQueueConsole);
		batchDeletionUc = module.get(BatchDeletionUc);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('console should be defined', () => {
		expect(console).toBeDefined();
	});

	describe('pushDeletionRequests', () => {
		describe('when called with valid options', () => {
			const setup = () => {
				jest.spyOn(fs, 'readFileSync').mockReturnValueOnce('');
				const refsFilePath = '/tmp/ids.txt';
				const targetRefDomain = 'school';
				const deleteInMinutes = 43200;
				const callsDelayMs = 100;

				const options = PushDeleteRequestsOptionsBuilder.build(
					refsFilePath,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs
				);

				return {
					refsFilePath,
					targetRefDomain,
					deleteInMinutes,
					callsDelayMs,
					options,
				};
			};

			it(`should call ${BatchDeletionUc.name} with proper arguments`, async () => {
				const { refsFilePath, targetRefDomain, deleteInMinutes, callsDelayMs, options } = setup();

				const spy = jest.spyOn(batchDeletionUc, 'deleteRefsFromTxtFile');

				await console.pushDeletionRequests(options);

				expect(spy).toBeCalledWith(refsFilePath, targetRefDomain, deleteInMinutes, callsDelayMs);
			});
		});
	});

	describe('unsyncedEntities', () => {
		describe('when called with an invalid "unsyncedForMinutes" option', () => {
			const setup = () => {
				const options = UnsyncedEntitiesOptionsBuilder.build(new ObjectId().toHexString(), 15);

				return { options };
			};

			it('should throw an exception', async () => {
				const { options } = setup();

				await expect(console.unsyncedEntities(options)).rejects.toThrow();
			});
		});

		describe('when called with valid options', () => {
			const setup = () => {
				const options = UnsyncedEntitiesOptionsBuilder.build(new ObjectId().toHexString(), 3600);

				return { options };
			};

			it('should not throw any exception indicating invalid options', async () => {
				const { options } = setup();

				await expect(console.unsyncedEntities(options)).resolves.not.toThrow();
			});
		});
	});
});
