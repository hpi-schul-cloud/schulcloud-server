import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AccountService } from '@modules/account';
import { systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserSourceOptions } from '@shared/domain/domainobject/user-source-options.do';
import { userDoFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
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
		describe('when tsp users are to be migrated who have an old and new id', () => {
			const setup = () => {
				const system = systemFactory.build();
				const oldToNewMappings = new Map<string, string>();
				oldToNewMappings.set('oldId', 'newId');

				configService.getOrThrow.mockReturnValueOnce(1);

				return { system, oldToNewMappings };
			};

			it('should migrate the tsp users', async () => {
				const { system, oldToNewMappings } = setup();
				const result = await sut.migrateTspUsers(system, oldToNewMappings);

				expect(result).toBeDefined();
			});
		});

		describe('when tsp users are to be migrated who have no old id', () => {
			const setup = () => {
				const system = systemFactory.build();
				const oldToNewMappings = new Map<string, string>();
				oldToNewMappings.set('oldId', 'newId');

				const user = userDoFactory.build();
				user.sourceOptions = new UserSourceOptions({ tspUid: undefined });

				configService.getOrThrow.mockReturnValueOnce(1);
				userService.findByTspUids.mockResolvedValueOnce([user]);

				return { system, oldToNewMappings };
			};

			it('should not migrate the tsp users', async () => {
				const { system, oldToNewMappings } = setup();
				const result = await sut.migrateTspUsers(system, oldToNewMappings);

				expect(result.totalUsers).toBe(0);
			});
		});
	});
});
