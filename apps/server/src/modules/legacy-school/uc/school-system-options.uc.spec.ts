import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { System, SystemService } from '@modules/system';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { schoolSystemOptionsFactory, setupEntities, systemFactory, userFactory } from '@shared/testing/factory';
import { AnyProvisioningOptions, SchoolSystemOptions, SchulConneXProvisioningOptions } from '../domain';
import { ProvisioningStrategyMissingLoggableException } from '../loggable';
import { ProvisioningOptionsUpdateService, SchoolSystemOptionsService } from '../service';
import { SchoolSystemOptionsUc } from './school-system-options.uc';

describe(SchoolSystemOptionsUc.name, () => {
	let module: TestingModule;
	let uc: SchoolSystemOptionsUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let systemService: DeepMocked<SystemService>;
	let schoolSystemOptionsService: DeepMocked<SchoolSystemOptionsService>;
	let provisioningOptionsUpdateService: DeepMocked<ProvisioningOptionsUpdateService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				SchoolSystemOptionsUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: SchoolSystemOptionsService,
					useValue: createMock<SchoolSystemOptionsService>(),
				},
				{
					provide: ProvisioningOptionsUpdateService,
					useValue: createMock<ProvisioningOptionsUpdateService>(),
				},
			],
		}).compile();

		uc = module.get(SchoolSystemOptionsUc);
		authorizationService = module.get(AuthorizationService);
		systemService = module.get(SystemService);
		schoolSystemOptionsService = module.get(SchoolSystemOptionsService);
		provisioningOptionsUpdateService = module.get(ProvisioningOptionsUpdateService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getProvisioningOptions', () => {
		describe('when options exist', () => {
			const setup = () => {
				const user = userFactory.asAdmin().buildWithId();
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build();

				schoolSystemOptionsService.findBySchoolIdAndSystemId.mockResolvedValueOnce(schoolSystemOptions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					schoolSystemOptions,
				};
			};

			it('should check the permissions', async () => {
				const { user, schoolSystemOptions } = setup();

				await uc.getProvisioningOptions(user.id, schoolSystemOptions.schoolId, schoolSystemOptions.systemId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					schoolSystemOptions,
					AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_VIEW])
				);
			});

			it('should return the options', async () => {
				const { user, schoolSystemOptions } = setup();

				const result: AnyProvisioningOptions = await uc.getProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId
				);

				expect(result).toEqual(schoolSystemOptions.provisioningOptions);
			});
		});

		describe('when no options exist', () => {
			const setup = () => {
				const user = userFactory.asAdmin().buildWithId();

				schoolSystemOptionsService.findBySchoolIdAndSystemId.mockResolvedValueOnce(null);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
				};
			};

			it('should throw an error', async () => {
				const { user } = setup();

				await expect(
					uc.getProvisioningOptions(user.id, new ObjectId().toHexString(), new ObjectId().toHexString())
				).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('createOrUpdateProvisioningOptions', () => {
		describe('when saving new options to a system at the school', () => {
			const setup = () => {
				const user = userFactory.asAdmin().buildWithId();
				const system: System = systemFactory.build({ provisioningStrategy: SystemProvisioningStrategy.SANIS });
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: system.id,
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningCoursesEnabled: true,
						groupProvisioningOtherEnabled: true,
					}),
				});

				systemService.findById.mockResolvedValueOnce(system);
				schoolSystemOptionsService.findBySchoolIdAndSystemId.mockResolvedValueOnce(null);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolSystemOptionsService.save.mockResolvedValueOnce(schoolSystemOptions);

				return {
					user,
					schoolSystemOptions,
				};
			};

			it('should check the permissions', async () => {
				const { user, schoolSystemOptions } = setup();

				await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					schoolSystemOptions.provisioningOptions
				);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					new SchoolSystemOptions({ ...schoolSystemOptions.getProps(), id: expect.any(String) }),
					AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_EDIT])
				);
			});

			it('should execute additional update actions', async () => {
				const { user, schoolSystemOptions } = setup();

				await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					schoolSystemOptions.provisioningOptions
				);

				expect(provisioningOptionsUpdateService.handleUpdate).toHaveBeenCalledWith(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					schoolSystemOptions.provisioningOptions,
					new SchulConneXProvisioningOptions()
				);
			});

			it('should save the options', async () => {
				const { user, schoolSystemOptions } = setup();

				await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					schoolSystemOptions.provisioningOptions
				);

				expect(schoolSystemOptionsService.save).toHaveBeenCalledWith(
					new SchoolSystemOptions({ ...schoolSystemOptions.getProps(), id: expect.any(String) })
				);
			});

			it('should return the options', async () => {
				const { user, schoolSystemOptions } = setup();

				const result: AnyProvisioningOptions = await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					schoolSystemOptions.provisioningOptions
				);

				expect(result).toEqual(schoolSystemOptions.provisioningOptions);
			});
		});

		describe('when saving existing options to a system at the school', () => {
			const setup = () => {
				const user = userFactory.asAdmin().buildWithId();
				const system: System = systemFactory.build({ provisioningStrategy: SystemProvisioningStrategy.SANIS });
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: system.id,
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: false,
						groupProvisioningCoursesEnabled: false,
						groupProvisioningOtherEnabled: false,
					}),
				});
				const newOptions: AnyProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: true,
					groupProvisioningCoursesEnabled: true,
					groupProvisioningOtherEnabled: true,
				});

				systemService.findById.mockResolvedValueOnce(system);
				schoolSystemOptionsService.findBySchoolIdAndSystemId.mockResolvedValueOnce(schoolSystemOptions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolSystemOptionsService.save.mockResolvedValueOnce(
					new SchoolSystemOptions({ ...schoolSystemOptions.getProps(), provisioningOptions: newOptions })
				);

				return {
					user,
					schoolSystemOptions,
					newOptions,
				};
			};

			it('should check the permissions', async () => {
				const { user, schoolSystemOptions, newOptions } = setup();

				await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newOptions
				);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					new SchoolSystemOptions({ ...schoolSystemOptions.getProps(), provisioningOptions: newOptions }),
					AuthorizationContextBuilder.read([Permission.SCHOOL_SYSTEM_EDIT])
				);
			});

			it('should execute additional update actions', async () => {
				const { user, schoolSystemOptions, newOptions } = setup();

				await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newOptions
				);

				expect(provisioningOptionsUpdateService.handleUpdate).toHaveBeenCalledWith(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newOptions,
					schoolSystemOptions.provisioningOptions
				);
			});

			it('should save the options', async () => {
				const { user, schoolSystemOptions, newOptions } = setup();

				await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newOptions
				);

				expect(schoolSystemOptionsService.save).toHaveBeenCalledWith(
					new SchoolSystemOptions({ ...schoolSystemOptions.getProps(), provisioningOptions: newOptions })
				);
			});

			it('should return the options', async () => {
				const { user, schoolSystemOptions, newOptions } = setup();

				const result: AnyProvisioningOptions = await uc.createOrUpdateProvisioningOptions(
					user.id,
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newOptions
				);

				expect(result).toEqual(newOptions);
			});
		});

		describe('when the requested system does not exist', () => {
			const setup = () => {
				systemService.findById.mockResolvedValueOnce(null);
			};

			it('should throw an error', async () => {
				setup();

				await expect(
					uc.createOrUpdateProvisioningOptions(
						new ObjectId().toHexString(),
						new ObjectId().toHexString(),
						new ObjectId().toHexString(),
						{}
					)
				).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the requested system does not have a provisioning strategy', () => {
			const setup = () => {
				const system: System = systemFactory.build({ provisioningStrategy: undefined });

				systemService.findById.mockResolvedValueOnce(system);
			};

			it('should throw an error', async () => {
				setup();

				await expect(
					uc.createOrUpdateProvisioningOptions(
						new ObjectId().toHexString(),
						new ObjectId().toHexString(),
						new ObjectId().toHexString(),
						{}
					)
				).rejects.toThrow(ProvisioningStrategyMissingLoggableException);
			});
		});

		describe('when the authorization fails', () => {
			const setup = () => {
				const user = userFactory.asStudent().buildWithId();
				const system: System = systemFactory.build({ provisioningStrategy: SystemProvisioningStrategy.SANIS });
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					systemId: system.id,
				});

				const error = new Error('Unauthorized');

				systemService.findById.mockResolvedValueOnce(system);
				schoolSystemOptionsService.findBySchoolIdAndSystemId.mockResolvedValueOnce(schoolSystemOptions);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw error;
				});

				return {
					user,
					schoolSystemOptions,
					error,
				};
			};

			it('should not save', async () => {
				const { user, schoolSystemOptions } = setup();

				await expect(
					uc.createOrUpdateProvisioningOptions(
						user.id,
						schoolSystemOptions.schoolId,
						schoolSystemOptions.systemId,
						schoolSystemOptions.provisioningOptions
					)
				).rejects.toThrow();

				expect(schoolSystemOptionsService.save).not.toHaveBeenCalled();
			});

			it('should throw an error', async () => {
				const { user, schoolSystemOptions, error } = setup();

				await expect(
					uc.createOrUpdateProvisioningOptions(
						user.id,
						schoolSystemOptions.schoolId,
						schoolSystemOptions.systemId,
						schoolSystemOptions.provisioningOptions
					)
				).rejects.toThrow(error);
			});
		});
	});
});
