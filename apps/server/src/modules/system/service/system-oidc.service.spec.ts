import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { SystemEntity } from '@shared/domain/entity';
import { LegacySystemRepo } from '@shared/repo';
import { systemEntityFactory } from '@shared/testing/factory';
import { SystemOidcMapper } from '../mapper/system-oidc.mapper';
import { SystemOidcService } from './system-oidc.service';

describe('SystemService', () => {
	let module: TestingModule;
	let systemService: SystemOidcService;
	let systemRepoMock: DeepMocked<LegacySystemRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemOidcService,
				{
					provide: LegacySystemRepo,
					useValue: createMock<LegacySystemRepo>(),
				},
			],
		}).compile();
		systemRepoMock = module.get(LegacySystemRepo);
		systemService = module.get(SystemOidcService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		const oidcSystem = systemEntityFactory.withOidcConfig().buildWithId({ alias: 'oidcSystem' });
		const standaloneSystem = systemEntityFactory.buildWithId({ alias: 'standaloneSystem' });
		const setup = (system: SystemEntity) => {
			systemRepoMock.findById.mockResolvedValue(system);
		};

		it('should return a found oidc system', async () => {
			setup(oidcSystem);
			const result = await systemService.findById('someMockedId');
			expect(result).toStrictEqual(SystemOidcMapper.mapFromEntityToDto(oidcSystem));
		});

		it('should throw if system does not contain a oidc config', async () => {
			setup(standaloneSystem);
			await expect(systemService.findById('someMockedId')).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('findAll', () => {
		const ldapSystem = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'ldapSystem' });
		const oauthSystem = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'oauthSystem' });
		const oidcSystem = systemEntityFactory.withOidcConfig().buildWithId({ alias: 'oidcSystem' });

		it('should return oidc systems only', async () => {
			systemRepoMock.findByFilter.mockResolvedValue([ldapSystem, oauthSystem, oidcSystem]);
			const result = await systemService.findAll();
			expect(result).toEqual(expect.arrayContaining(SystemOidcMapper.mapFromEntitiesToDtos([oidcSystem])));
		});

		it('should return empty list if no oidc system exists', async () => {
			systemRepoMock.findByFilter.mockResolvedValue([ldapSystem, oauthSystem]);
			const result = await systemService.findAll();
			expect(result).toHaveLength(0);
		});
	});
});
