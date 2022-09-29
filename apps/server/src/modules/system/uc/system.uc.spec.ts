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
	let system2: System;

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
		system2 = systemFactory.buildWithId();

		mockSystems = [system1, system2].map((element) => SystemMapper.mapFromEntityToDto(element));

		systemService.find.mockImplementation((type: string | undefined) => {
			if (type === 'type') {
				return Promise.resolve([system1]);
			}
			return Promise.resolve(mockSystems);
		});
		systemService.findOAuth.mockImplementation(() => {
			return Promise.resolve([system2]);
		});
		systemService.findById.mockImplementation((id: EntityId): Promise<SystemDto> => {
			return id === system1.id ? Promise.resolve(system1) : Promise.reject();
		});
	});

	describe('findByFilter', () => {
		it('should return systems by default', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter();

			expect(systems.length).toEqual(mockSystems.length);
			expect(systems).toContainEqual(expect.objectContaining({ alias: system1.alias }));
			expect(systems).toContainEqual(expect.objectContaining({ alias: system2.alias }));
		});

		it('should return specified systems by type', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter('type');

			expect(systems.length).toEqual(1);
			expect(systems[0].oauthConfig?.clientId).toEqual(system1.oauthConfig?.clientId);
		});

		it('should return oauth systems if requested', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter(undefined, true);

			expect(systems.length).toEqual(1);
			expect(systems[0].oauthConfig?.clientId).toEqual(system2.oauthConfig?.clientId);
		});

		it('should return empty system list, because none exist', async () => {
			systemService.find.mockResolvedValue([]);
			const resultResponse = await systemUc.findByFilter();
			expect(resultResponse).toHaveLength(0);
		});
	});

	describe('findById', () => {
		it('should return a system by id', async () => {
			const receivedSystem: SystemDto = await systemUc.findById(system1.id);

			expect(receivedSystem.alias).toEqual(system1.alias);
		});

		it('should reject promise, because no entity was found', async () => {
			await expect(systemUc.findById('unknown id')).rejects.toEqual(undefined);
		});
	});
});
