import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SystemUc } from '@modules/system/uc/system.uc';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { setupEntities, systemFactory, userFactory } from '@shared/testing';
import { SystemDeletedEvent, SystemQuery, SystemType } from '../domain';
import { SystemService } from '../service';

describe('SystemUc', () => {
	let module: TestingModule;
	let systemUc: SystemUc;

	let systemService: DeepMocked<SystemService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SystemUc,
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
			],
		}).compile();

		systemUc = module.get(SystemUc);
		systemService = module.get(SystemService);
		authorizationService = module.get(AuthorizationService);
		eventBus = module.get(EventBus);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('find', () => {
		describe('when no query is provided', () => {
			const setup = () => {
				const oauthSystem = systemFactory.withOauthConfig().build();
				const ldapSystem = systemFactory.withLdapConfig({ active: true }).build();
				const deactivatedLdapSystem = systemFactory.withLdapConfig({ active: false }).build();

				systemService.find.mockResolvedValueOnce([oauthSystem, ldapSystem, deactivatedLdapSystem]);

				return {
					oauthSystem,
					ldapSystem,
					deactivatedLdapSystem,
				};
			};

			it('should find all systems', async () => {
				setup();

				await systemUc.find();

				expect(systemService.find).toHaveBeenCalledWith({});
			});

			it('should return all active systems', async () => {
				const { oauthSystem, ldapSystem } = setup();

				const result = await systemUc.find();

				expect(result).toEqual([oauthSystem, ldapSystem]);
			});
		});

		describe('when types are provided', () => {
			const setup = () => {
				const ldapSystem = systemFactory.withLdapConfig({ active: true }).build();
				const deactivatedLdapSystem = systemFactory.withLdapConfig({ active: false }).build();

				systemService.find.mockResolvedValueOnce([ldapSystem, deactivatedLdapSystem]);

				return {
					ldapSystem,
					deactivatedLdapSystem,
				};
			};

			it('should find all systems of this type', async () => {
				setup();

				await systemUc.find([SystemType.LDAP]);

				expect(systemService.find).toHaveBeenCalledWith<[SystemQuery]>({ types: [SystemType.LDAP] });
			});

			it('should return all active systems of this type', async () => {
				const { ldapSystem } = setup();

				const result = await systemUc.find();

				expect(result).toEqual([ldapSystem]);
			});
		});
	});

	describe('findById', () => {
		describe('when a system with the id exists', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig().build();

				systemService.findById.mockResolvedValueOnce(system);

				return {
					system,
				};
			};

			it('should find the system by id', async () => {
				const { system } = setup();

				await systemUc.findById(system.id);

				expect(systemService.findById).toHaveBeenCalledWith(system.id);
			});

			it('should return the system', async () => {
				const { system } = setup();

				const result = await systemUc.findById(system.id);

				expect(result).toEqual(system);
			});
		});

		describe('when no system with the id exists', () => {
			const setup = () => {
				systemService.findById.mockResolvedValueOnce(null);
			};

			it('should throw an error', async () => {
				setup();

				await expect(systemUc.findById(new ObjectId().toHexString())).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the system is a deactivated ldap system', () => {
			const setup = () => {
				const system = systemFactory.withLdapConfig({ active: false }).build();

				systemService.findById.mockResolvedValueOnce(system);

				return {
					system,
				};
			};

			it('should throw an error', async () => {
				const { system } = setup();

				await expect(systemUc.findById(system.id)).rejects.toThrow(NotFoundLoggableException);
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

				await systemUc.delete(user.id, user.school.id, system.id);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					system,
					AuthorizationContextBuilder.write([Permission.SYSTEM_CREATE])
				);
			});

			it('should delete the system', async () => {
				const { user, system } = setup();

				await systemUc.delete(user.id, user.school.id, system.id);

				expect(systemService.delete).toHaveBeenCalledWith(system);
			});

			it('should remove the system from the school', async () => {
				const { user, system } = setup();

				await systemUc.delete(user.id, user.school.id, system.id);

				expect(eventBus.publish).toHaveBeenCalledWith(new SystemDeletedEvent({ schoolId: user.school.id, system }));
			});
		});

		describe('when the system does not exist', () => {
			const setup = () => {
				systemService.findById.mockResolvedValueOnce(null);
			};

			it('should throw a not found exception', async () => {
				setup();

				await expect(
					systemUc.delete(new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString())
				).rejects.toThrow(NotFoundLoggableException);
			});

			it('should not delete any system', async () => {
				setup();

				await expect(
					systemUc.delete(new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString())
				).rejects.toThrow();

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

				await expect(systemUc.delete(user.id, user.school.id, system.id)).rejects.toThrow(error);
			});

			it('should not delete any system', async () => {
				const { user, system } = setup();

				await expect(systemUc.delete(user.id, user.school.id, system.id)).rejects.toThrow();

				expect(systemService.delete).not.toHaveBeenCalled();
			});
		});
	});
});
