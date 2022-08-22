import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, System } from '@shared/domain';
import { SystemRepo } from '@shared/repo';
import { setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemService } from './system.service';
import {SysType} from "@shared/infra/identity-management";

describe('SystemService', () => {
	let module: TestingModule;
	let systemService: SystemService;
	let orm: MikroORM;
	let oauthSystems: System[] = [];
	const allSystems: System[] = [];

	let systemRepo: DeepMocked<SystemRepo>;

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemService,
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
			],
		}).compile();
		orm = await setupEntities();
		systemRepo = module.get(SystemRepo);
		systemService = module.get(SystemService);
	});

	beforeEach(() => {
		oauthSystems = [];
		const iserv = systemFactory.buildWithId();
		oauthSystems.push(iserv);
		allSystems.push(iserv);
		allSystems.push(systemFactory.buildWithId({ oauthConfig: undefined }));
		allSystems.push(systemFactory.buildWithId({ type: 'moodle' }));
		allSystems.push(systemFactory.buildWithId({ type: SysType.KEYCLOAK, alias: 'Keycloak', oauthConfig: {} }));
		allSystems.push(systemFactory.buildWithId({ type: SysType.OIDC, alias: 'Third Party System' }));

		systemRepo.findByFilter.mockResolvedValue(oauthSystems);
		systemRepo.findAll.mockResolvedValue(allSystems);
		systemRepo.findById.mockImplementation((id: EntityId): Promise<System> => {
			return id === iserv.id ? Promise.resolve(iserv) : Promise.reject();
		});
	});

	describe('findByFilter', () => {
		it('should return oauth system iserv', async () => {
			// Act
			const resultSystems = await systemService.find(oauthSystems[0].type);

			// Assert
			expect(resultSystems.length).toEqual(oauthSystems.length);
		});

		it('should return all systems', async () => {
			// Act
			const resultSystems = await systemService.find('');

			// Assert
			expect(resultSystems.length).toEqual(allSystems.length);
		});
	});

	describe('findById', () => {
		it('should return oauth system iserv', async () => {
			// Act
			const resultSystems = await systemService.findById(oauthSystems[0].id);

			// Assert
			expect(resultSystems.alias).toEqual(oauthSystems[0].alias);
		});

		it('should reject promise, because no entity was found', async () => {
			await expect(systemService.findById('unknown id')).rejects.toEqual(undefined);
		});
	});
});
