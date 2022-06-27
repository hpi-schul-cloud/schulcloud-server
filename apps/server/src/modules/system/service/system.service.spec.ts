import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { SystemRepo } from '@shared/repo';
import { setupEntities, systemFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemService } from './system.service';

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
		const iserv = systemFactory.build();
		oauthSystems.push(iserv);
		allSystems.push(iserv);
		allSystems.push(systemFactory.build({ oauthConfig: undefined }));
		const moodle = systemFactory.build();
		moodle.type = 'moodle';
		allSystems.push(moodle);

		systemRepo.findByFilter.mockResolvedValue(oauthSystems);
		systemRepo.findAll.mockResolvedValue(allSystems);
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
});
