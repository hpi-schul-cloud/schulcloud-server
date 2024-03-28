import { ObjectId } from 'bson';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@infra/console';
import { createMock } from '@golevelup/ts-jest';
import { IdpSyncConsole } from './idp-sync-console';
import { SystemType } from './interface';
import { UsersSyncOptionsBuilder } from './builder';

describe(IdpSyncConsole.name, () => {
	let module: TestingModule;
	let console: IdpSyncConsole;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				IdpSyncConsole,
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
			],
		}).compile();

		console = module.get(IdpSyncConsole);
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

	describe('users', () => {
		describe('when called with an invalid system type', () => {
			const setup = () => {
				const systemType = 'test';
				const systemId = new ObjectId().toHexString();

				const options = UsersSyncOptionsBuilder.build(systemType as SystemType, systemId);

				return {
					systemType,
					systemId,
					options,
				};
			};

			it('should throw an exception', async () => {
				const { options } = setup();

				await expect(console.users(options)).rejects.toThrow();
			});
		});

		describe('when called with valid options', () => {
			const setup = () => {
				const systemType = SystemType.MOIN_SCHULE;
				const systemId = new ObjectId().toHexString();

				const options = UsersSyncOptionsBuilder.build(systemType, systemId);

				return {
					systemType,
					systemId,
					options,
				};
			};

			it(`should not throw an exception indicating invalid system type`, async () => {
				const { options } = setup();

				await expect(console.users(options)).resolves.not.toThrow();
			});
		});
	});
});
