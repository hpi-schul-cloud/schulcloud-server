import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { EntityId, SystemEntity, SystemTypeEnum } from '@shared/domain';
import { systemFactory } from '@shared/testing';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemUc } from '@src/modules/system/uc/system.uc';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let mockSystem1: SystemDto;
	let mockSystem2: SystemDto;
	let mockSystems: SystemDto[];
	let system1: SystemEntity;
	let system2: SystemEntity;

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

		mockSystem1 = SystemMapper.mapFromEntityToDto(system1);
		mockSystem2 = SystemMapper.mapFromEntityToDto(system2);
		mockSystems = [mockSystem1, mockSystem2];

		systemService.findByType.mockImplementation((type: string | undefined) => {
			if (type === SystemTypeEnum.OAUTH) return Promise.resolve([mockSystem1]);
			return Promise.resolve(mockSystems);
		});
		systemService.findById.mockImplementation(
			(id: EntityId): Promise<SystemDto> => (id === system1.id ? Promise.resolve(mockSystem1) : Promise.reject())
		);
	});

	describe('findByFilter', () => {
		it('should return systems by default', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter();

			expect(systems.length).toEqual(mockSystems.length);
			expect(systems).toContainEqual(expect.objectContaining({ alias: system1.alias }));
			expect(systems).toContainEqual(expect.objectContaining({ alias: system2.alias }));
		});

		it('should return specified systems by type', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter(SystemTypeEnum.OAUTH);

			expect(systems.length).toEqual(1);
			expect(systems[0].oauthConfig?.clientId).toEqual(system1.oauthConfig?.clientId);
		});

		it('should return oauth systems if requested', async () => {
			const systems: SystemDto[] = await systemUc.findByFilter(undefined, true);

			expect(systems.length).toEqual(1);
			expect(systems[0].oauthConfig?.clientId).toEqual(system2.oauthConfig?.clientId);
		});

		it('should return empty system list, because none exist', async () => {
			systemService.findByType.mockResolvedValue([]);
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

		describe('when the ldap is not active', () => {
			const setup = () => {
				const system: SystemDto = new SystemDto({
					ldapActive: false,
					type: 'ldap',
				});

				systemService.findById.mockResolvedValue(system);
			};

			it('should reject promise, because ldap is not active', async () => {
				setup();

				const func = async () => systemUc.findById('id');

				await expect(func).rejects.toThrow(EntityNotFoundError);
			});
		});
	});
});
