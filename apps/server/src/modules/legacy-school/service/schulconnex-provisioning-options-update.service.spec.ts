import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Group, GroupService, GroupTypes } from '@modules/group';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { groupFactory, schoolSystemOptionsFactory } from '@shared/testing';
import { SchoolSystemOptions, SchulConneXProvisioningOptions } from '../domain';
import { SchulconnexProvisioningOptionsUpdateService } from './schulconnex-provisioning-options-update.service';

describe(SchulconnexProvisioningOptionsUpdateService.name, () => {
	let module: TestingModule;
	let service: SchulconnexProvisioningOptionsUpdateService;

	let groupService: DeepMocked<GroupService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexProvisioningOptionsUpdateService,
				{
					provide: GroupService,
					useValue: createMock<GroupService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexProvisioningOptionsUpdateService);
		groupService = module.get(GroupService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handleUpdate', () => {
		describe('when groupProvisioningClassesEnabled gets turned off', () => {
			const setup = () => {
				const schoolSystemOptions: SchoolSystemOptions = schoolSystemOptionsFactory.build({
					provisioningOptions: new SchulConneXProvisioningOptions().set({
						groupProvisioningClassesEnabled: true,
						groupProvisioningOtherEnabled: true,
						groupProvisioningCoursesEnabled: true,
						schoolExternalToolProvisioningEnabled: true,
					}),
				});
				const newProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: false,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: true,
					schoolExternalToolProvisioningEnabled: true,
				});
				const group: Group = groupFactory.build({ type: GroupTypes.CLASS });
				const page: Page<Group> = new Page<Group>([group], 1);

				groupService.findGroups.mockResolvedValueOnce(page);

				return {
					schoolSystemOptions,
					newProvisioningOptions,
					group,
				};
			};

			it('should search for all classes of the school for the system', async () => {
				const { schoolSystemOptions, newProvisioningOptions } = setup();

				await service.handleUpdate(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.findGroups).toHaveBeenCalledWith({
					schoolId: schoolSystemOptions.schoolId,
					systemId: schoolSystemOptions.systemId,
					groupTypes: [GroupTypes.CLASS],
				});
			});

			it('should delete all classes', async () => {
				const { schoolSystemOptions, newProvisioningOptions, group } = setup();

				await service.handleUpdate(
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
						schoolExternalToolProvisioningEnabled: true,
					}),
				});
				const newProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: true,
					groupProvisioningCoursesEnabled: false,
					schoolExternalToolProvisioningEnabled: true,
				});
				const group: Group = groupFactory.build({ type: GroupTypes.COURSE });
				const page: Page<Group> = new Page<Group>([group], 1);

				groupService.findGroups.mockResolvedValueOnce(page);

				return {
					schoolSystemOptions,
					newProvisioningOptions,
					group,
				};
			};

			it('should search for all courses of the school for the system', async () => {
				const { schoolSystemOptions, newProvisioningOptions } = setup();

				await service.handleUpdate(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.findGroups).toHaveBeenCalledWith({
					schoolId: schoolSystemOptions.schoolId,
					systemId: schoolSystemOptions.systemId,
					groupTypes: [GroupTypes.COURSE],
				});
			});

			it('should delete all courses', async () => {
				const { schoolSystemOptions, newProvisioningOptions, group } = setup();

				await service.handleUpdate(
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
						schoolExternalToolProvisioningEnabled: true,
					}),
				});
				const newProvisioningOptions = new SchulConneXProvisioningOptions().set({
					groupProvisioningClassesEnabled: true,
					groupProvisioningOtherEnabled: false,
					groupProvisioningCoursesEnabled: true,
					schoolExternalToolProvisioningEnabled: true,
				});
				const group: Group = groupFactory.build({ type: GroupTypes.OTHER });
				const page: Page<Group> = new Page<Group>([group], 1);

				groupService.findGroups.mockResolvedValueOnce(page);

				return {
					schoolSystemOptions,
					newProvisioningOptions,
					group,
				};
			};

			it('should search for all other groups of the school for the system', async () => {
				const { schoolSystemOptions, newProvisioningOptions } = setup();

				await service.handleUpdate(
					schoolSystemOptions.schoolId,
					schoolSystemOptions.systemId,
					newProvisioningOptions,
					schoolSystemOptions.provisioningOptions
				);

				expect(groupService.findGroups).toHaveBeenCalledWith({
					schoolId: schoolSystemOptions.schoolId,
					systemId: schoolSystemOptions.systemId,
					groupTypes: [GroupTypes.OTHER],
				});
			});

			it('should delete all other groups', async () => {
				const { schoolSystemOptions, newProvisioningOptions, group } = setup();

				await service.handleUpdate(
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
