import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { SystemDto } from '@modules/system/service/dto/system.dto';
import { SystemUc } from '@modules/system/uc/system.uc';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId, Permission, SystemEntity, SystemTypeEnum } from '@shared/domain';
import { setupEntities, systemEntityFactory, systemFactory, userFactory } from '@shared/testing';
import { AuthorizationContextBuilder, AuthorizationService } from '../../authorization';
import { SystemMapper } from '../mapper';
import { LegacySystemService, SystemService } from '../service';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;
	let mockSystem1: SystemDto;
	let mockSystem2: SystemDto;
	let mockSystems: SystemDto[];
	let system1: SystemEntity;
	let system2: SystemEntity;

	let legacySystemService: DeepMocked<LegacySystemService>;
	let systemService: DeepMocked<SystemService>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SystemUc,
				{
					provide: LegacySystemService,
					useValue: createMock<LegacySystemService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		systemUc = module.get(SystemUc);
		legacySystemService = module.get(LegacySystemService);
		systemService = module.get(SystemService);
		authorizationService = module.get(AuthorizationService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByFilter', () => {
		beforeEach(() => {
			system1 = systemEntityFactory.buildWithId();
			system2 = systemEntityFactory.buildWithId();

			mockSystem1 = SystemMapper.mapFromEntityToDto(system1);
			mockSystem2 = SystemMapper.mapFromEntityToDto(system2);
			mockSystems = [mockSystem1, mockSystem2];

			legacySystemService.findByType.mockImplementation((type: string | undefined) => {
				if (type === SystemTypeEnum.OAUTH) return Promise.resolve([mockSystem1]);
				return Promise.resolve(mockSystems);
			});
			legacySystemService.findById.mockImplementation(
				(id: EntityId): Promise<SystemDto> => (id === system1.id ? Promise.resolve(mockSystem1) : Promise.reject())
			);
		});

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
			legacySystemService.findByType.mockResolvedValue([]);
			const resultResponse = await systemUc.findByFilter();
			expect(resultResponse).toHaveLength(0);
		});
	});

	describe('findById', () => {
		beforeEach(() => {
			system1 = systemEntityFactory.buildWithId();
			system2 = systemEntityFactory.buildWithId();

			mockSystem1 = SystemMapper.mapFromEntityToDto(system1);
			mockSystem2 = SystemMapper.mapFromEntityToDto(system2);
			mockSystems = [mockSystem1, mockSystem2];

			legacySystemService.findByType.mockImplementation((type: string | undefined) => {
				if (type === SystemTypeEnum.OAUTH) return Promise.resolve([mockSystem1]);
				return Promise.resolve(mockSystems);
			});
			legacySystemService.findById.mockImplementation(
				(id: EntityId): Promise<SystemDto> => (id === system1.id ? Promise.resolve(mockSystem1) : Promise.reject())
			);
		});

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

				legacySystemService.findById.mockResolvedValue(system);
			};

			it('should reject promise, because ldap is not active', async () => {
				setup();

				const func = async () => systemUc.findById('id');

				await expect(func).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('delete', () => {
		describe('when the system exists and the user can delete it', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const system = systemFactory.build();

				systemService.findById.mockResolvedValueOnce(system);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					system,
				};
			};

			it('should check the permission', async () => {
				const { user, system } = setup();

				await systemUc.delete(user.id, system.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					system,
					AuthorizationContextBuilder.write([Permission.SYSTEM_CREATE])
				);
			});

			it('should delete the system', async () => {
				const { user, system } = setup();

				await systemUc.delete(user.id, system.id);

				expect(systemService.delete).toHaveBeenCalledWith(system);
			});
		});

		describe('when the system does not exist', () => {
			const setup = () => {
				systemService.findById.mockResolvedValueOnce(null);
			};

			it('should throw a not found exception', async () => {
				setup();

				await expect(systemUc.delete(new ObjectId().toHexString(), new ObjectId().toHexString())).rejects.toThrow(
					NotFoundLoggableException
				);
			});

			it('should not delete any system', async () => {
				setup();

				await expect(systemUc.delete(new ObjectId().toHexString(), new ObjectId().toHexString())).rejects.toThrow();

				expect(systemService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when the user is not authorized', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const system = systemFactory.build();
				const error = new Error();

				systemService.findById.mockResolvedValueOnce(system);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementation(() => {
					throw error;
				});

				return {
					user,
					system,
					error,
				};
			};

			it('should throw an error', async () => {
				const { user, system, error } = setup();

				await expect(systemUc.delete(user.id, system.id)).rejects.toThrow(error);
			});

			it('should not delete any system', async () => {
				const { user, system } = setup();

				await expect(systemUc.delete(user.id, system.id)).rejects.toThrow();

				expect(systemService.delete).not.toHaveBeenCalled();
			});
		});
	});
});
