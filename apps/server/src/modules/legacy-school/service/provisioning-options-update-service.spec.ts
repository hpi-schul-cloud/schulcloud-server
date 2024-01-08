import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { Test, TestingModule } from '@nestjs/testing';
import { groupFactory, schoolSystemOptionsFactory } from '@shared/testing';
import { SchoolSystemOptions, SchulConneXProvisioningOptions } from '../domain';
import { ProvisioningOptionsUpdateService } from './provisioning-options-update-service';

describe(ProvisioningOptionsUpdateService.name, () => {
	let module: TestingModule;
	let service: ProvisioningOptionsUpdateService;

	let groupService: DeepMocked<GroupService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ProvisioningOptionsUpdateService,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
			],
		}).compile();

		service = module.get(ProvisioningOptionsUpdateService);
		groupService = module.get(GroupService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handleActions', () => {
		describe('when groupProvisioningClassesEnabled gets turned off', () => {
			const setup = () => {
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
					}),
				});
				const newProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: false,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: true,
				});
				const group: Group = groupFactory.build({ type: GroupTypes.CLASS });

				groupService.findGroupsBySchoolIdAndSystemIdAndGroupType.mockResolvedValueOnce([group]);

				return {
					schoolSystemOptions,
					newProvisioningOptions,
					group,
				};
			};

			it('should search for all classes of the school for the system', async () => {
				const { schoolSystemOptions, newProvisioningOptions } = setup();

				await service.handleActions(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.findGroupsBySchoolIdAndSystemIdAndGroupType).toHaveBeenCalledWith(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					GroupTypes.CLASS
				);
			});

			it('should delete all classes', async () => {
				const { schoolSystemOptions, newProvisioningOptions, group } = setup();

				await service.handleActions(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.delete).toHaveBeenCalledTimes(1);
				expect(groupService.delete).toHaveBeenCalledWith(group);
			});
		});

		describe('when groupProvisioningCoursesEnabled gets turned off', () => {
			const setup = () => {
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
					}),
				});
				const newProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: false,
				});
				const group: Group = groupFactory.build({ type: GroupTypes.COURSE });

				groupService.findGroupsBySchoolIdAndSystemIdAndGroupType.mockResolvedValueOnce([group]);

				return {
					schoolSystemOptions,
					newProvisioningOptions,
					group,
				};
			};

			it('should search for all courses of the school for the system', async () => {
				const { schoolSystemOptions, newProvisioningOptions } = setup();

				await service.handleActions(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.findGroupsBySchoolIdAndSystemIdAndGroupType).toHaveBeenCalledWith(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					GroupTypes.COURSE
				);
			});

			it('should delete all courses', async () => {
				const { schoolSystemOptions, newProvisioningOptions, group } = setup();

				await service.handleActions(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.delete).toHaveBeenCalledTimes(1);
				expect(groupService.delete).toHaveBeenCalledWith(group);
			});
		});

		describe('when groupProvisioningOtherEnabled gets turned off', () => {
			const setup = () => {
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
					}),
				});
				const newProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: false,
					groupProvisioningCoursesEnabled: true,
				});
				const group: Group = groupFactory.build({ type: GroupTypes.OTHER });

				groupService.findGroupsBySchoolIdAndSystemIdAndGroupType.mockResolvedValueOnce([group]);

				return {
					schoolSystemOptions,
					newProvisioningOptions,
					group,
				};
			};

			it('should search for all other groups of the school for the system', async () => {
				const { schoolSystemOptions, newProvisioningOptions } = setup();

				await service.handleActions(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.findGroupsBySchoolIdAndSystemIdAndGroupType).toHaveBeenCalledWith(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					GroupTypes.OTHER
				);
			});

			it('should delete all other groups', async () => {
				const { schoolSystemOptions, newProvisioningOptions, group } = setup();

				await service.handleActions(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.delete).toHaveBeenCalledTimes(1);
				expect(groupService.delete).toHaveBeenCalledWith(group);
			});
		});
	});
});
