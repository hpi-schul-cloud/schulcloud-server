import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { SystemUc } from '@src/modules/system/uc/system.uc';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { EntityId, System } from '@shared/domain';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let mockSystems: SystemDto[];
	let system1: System;

	let systemService: DeepMocked<SystemService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemUc,
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
			],
		}).compile();
		systemUc = module.get(SystemUc);
		systemService = module.get(SystemService);
	});

	beforeEach(() => {
		system1 = systemFactory.buildWithId();

		mockSystems = [];
		mockSystems.push(SystemMapper.mapFromEntityToDto(systemFactory.buildWithId()));
		mockSystems.push(SystemMapper.mapFromEntityToDto(system1));

		systemService.find.mockResolvedValue(mockSystems);
		systemService.findById.mockImplementation((id: EntityId): Promise<SystemDto> => {
			return id === system1.id ? Promise.resolve(system1) : Promise.reject();
		});
	});

	describe('findByFilter', () => {
		it('should return systems with oauthConfigs', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter();

			expect(systems.length).toEqual(mockSystems.length);
			expect(systems[0].oauthConfig?.clientId).toEqual(mockSystems[0].oauthConfig?.clientId);
			expect(systems[1].oauthConfig?.clientId).toEqual(mockSystems[1].oauthConfig?.clientId);
		});

		it('should return empty system list, because none exist', async () => {
			systemService.find.mockResolvedValue([]);
			const resultResponse = await systemUc.findByFilter();
			expect(resultResponse).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return a system by id', async () => {
			const system: SystemDto = await systemUc.findById(system1.id);

			expect(system.alias).toEqual(mockSystems[1].alias);
		});

		it('should reject promise, because no entity was found', async () => {
			await expect(systemUc.findById('unknown id')).rejects.toEqual(undefined);
		});
	});
});
