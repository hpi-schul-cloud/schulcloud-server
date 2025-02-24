import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { UserSourceOptions } from '@modules/user/domain';
import { userDoFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TspSyncMigrationService } from './tsp-sync-migration.service';
import { TspSyncConfig } from './tsp-sync.config';

describe(TspSyncMigrationService.name, () => {
	let module: TestingModule;
	let sut: TspSyncMigrationService;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let configService: DeepMocked<ConfigService<TspSyncConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspSyncMigrationService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<TspSyncConfig, true>>(),
				},
			],
		}).compile();

		sut = module.get(TspSyncMigrationService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		configService = module.get(ConfigService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when sync migration service is initialized', () => {
		it('should be defined', () => {
			expect(sut).toBeDefined();
		});
	});

	describe('migrateTspUsers', () => {
		describe('when old id, new id and user exist', () => {
			const setup = () => {
				const system = systemFactory.build();
				const oldToNewMappings = new Map<string, string>();
				oldToNewMappings.set('oldId', 'newId');

				const user = userDoFactory.build();
				user.sourceOptions = new UserSourceOptions({ tspUid: 'oldId' });

				configService.getOrThrow.mockReturnValueOnce(1);
				userService.findByTspUids.mockResolvedValueOnce([user]);
				accountService.findMultipleByUserId.mockResolvedValueOnce(accountDoFactory.buildList(1));

				return { system, oldToNewMappings };
			};

			it('should migrate the tsp users', async () => {
				const { system, oldToNewMappings } = setup();
				const result = await sut.migrateTspUsers(system, oldToNewMappings);

				expect(result).toBeDefined();
				expect(result.totalAmount).toBe(1);
				expect(result.totalUsers).toBe(1);
				expect(result.totalAccounts).toBe(1);
			});
		});

		describe('when tsp user does not have a tspUid', () => {
			const setup = () => {
				const system = systemFactory.build();
				const oldToNewMappings = new Map<string, string>();
				oldToNewMappings.set('oldId', 'newId');

				const user = userDoFactory.build();
				user.sourceOptions = new UserSourceOptions({ tspUid: undefined });

				configService.getOrThrow.mockReturnValueOnce(1);
				userService.findByTspUids.mockResolvedValueOnce([user]);
				accountService.findMultipleByUserId.mockResolvedValueOnce(accountDoFactory.buildList(1));

				return { system, oldToNewMappings };
			};

			it('should not migrate the tsp user', async () => {
				const { system, oldToNewMappings } = setup();
				const result = await sut.migrateTspUsers(system, oldToNewMappings);

				expect(result.totalUsers).toBe(0);
			});
		});

		describe('when newUid does not exist for a user', () => {
			const setup = () => {
				const system = systemFactory.build();
				const oldToNewMappings = new Map<string, string>();
				oldToNewMappings.set('oldId', 'newId');

				const user = userDoFactory.build();
				user.sourceOptions = new UserSourceOptions({ tspUid: 'oldIdWithoutNewIdMapping' });

				configService.getOrThrow.mockReturnValueOnce(1);
				userService.findByTspUids.mockResolvedValueOnce([user]);
				accountService.findMultipleByUserId.mockResolvedValueOnce(accountDoFactory.buildList(1));

				return { system, oldToNewMappings };
			};

			it('should not migrate the tsp user', async () => {
				const { system, oldToNewMappings } = setup();
				const result = await sut.migrateTspUsers(system, oldToNewMappings);

				expect(result.totalUsers).toBe(0);
			});
		});
	});
});
