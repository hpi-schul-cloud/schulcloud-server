import { ObjectId } from 'bson';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { defaultMikroOrmOptions } from '@shared/common';
import { IdpSyncConsole } from './idp-sync-console';
import { SystemType } from './interface';
import { UsersSyncOptionsBuilder } from '../testing';
import { SynchronizationUc } from './synchronization.uc';
import { IdpConsoleModule } from '../idp-console.app.module';

// Sorry but in the end this test do test neraly nothing..
describe(IdpSyncConsole.name, () => {
	let module: TestingModule;
	let console: IdpSyncConsole;
	let synchronizationUc: SynchronizationUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [IdpConsoleModule, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
		}).compile();

		console = module.get(IdpSyncConsole);
		synchronizationUc = module.get(SynchronizationUc);
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

			it(`should call ${SynchronizationUc.name} with proper arguemnts`, async () => {
				const { options } = setup();

				const spy = jest.spyOn(synchronizationUc, 'updateSystemUsersLastSyncedAt');

				await console.users(options);

				expect(spy).toBeCalledWith(options.systemId);
			});
		});
	});
});
