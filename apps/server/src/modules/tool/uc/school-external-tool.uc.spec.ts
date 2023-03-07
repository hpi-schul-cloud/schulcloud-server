import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, EntityId, Permission, User } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { setupEntities, userFactory } from '@shared/testing';
import { AllowedAuthorizationEntityType, AuthorizationService } from '@src/modules/authorization';
import { CourseExternalToolService, SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalToolUc } from './school-external-tool.uc';

describe('SchoolExternalToolUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: SchoolExternalToolUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let courseExternalToolService: DeepMocked<CourseExternalToolService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;

	beforeAll(async () => {
		orm = await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: CourseExternalToolService,
					useValue: createMock<CourseExternalToolService>(),
				},
				{
					provide: SchoolExternalToolValidationService,
					useValue: createMock<SchoolExternalToolValidationService>(),
				},
			],
		}).compile();

		uc = module.get(SchoolExternalToolUc);
		authorizationService = module.get(AuthorizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		courseExternalToolService = module.get(CourseExternalToolService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setup = () => {
		const tool: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
		const user: User = userFactory.buildWithId();

		return {
			user,
			userId: user.id,
			tool,
			schoolId: tool.schoolId,
			schoolExternalToolId: tool.id as EntityId,
		};
	};

	describe('findSchoolExternalTools is called', () => {
		describe('when checks permission', () => {
			it('should check the permissions of the user', async () => {
				const { user, tool, schoolId } = setup();

				await uc.findSchoolExternalTools(user.id, tool);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.School,
					schoolId,
					{
						action: Actions.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});
		});

		it('should call the service', async () => {
			const { user, tool } = setup();

			await uc.findSchoolExternalTools(user.id, tool);

			expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({ schoolId: tool.schoolId });
		});

		describe('when query parameters', () => {
			describe('are empty', () => {
				it('should not call the service', async () => {
					const { user } = setup();
					const emptyQuery: SchoolExternalToolQueryInput = {};

					await uc.findSchoolExternalTools(user.id, emptyQuery);

					expect(schoolExternalToolService.findSchoolExternalTools).not.toHaveBeenCalled();
				});

				it('should return a empty array', async () => {
					const { user } = setup();
					const emptyQuery: Partial<SchoolExternalToolDO> = {};

					const result: SchoolExternalToolDO[] = await uc.findSchoolExternalTools(user.id, emptyQuery);

					expect(result).toEqual([]);
				});
			});

			describe('has schoolId set', () => {
				it('should return a schoolExternalToolDO array', async () => {
					const { user, tool } = setup();
					schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool, tool]);

					const result: SchoolExternalToolDO[] = await uc.findSchoolExternalTools(user.id, tool);

					expect(result).toEqual([tool, tool]);
				});
			});
		});
	});

	describe('deleteSchoolExternalTool is called', () => {
		describe('when checks permission', () => {
			it('should check the permissions of the user', async () => {
				const { user, schoolExternalToolId } = setup();

				await uc.deleteSchoolExternalTool(user.id, schoolExternalToolId);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.SchoolExternalTool,
					schoolExternalToolId,
					{
						action: Actions.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});
		});

		describe('when calls services', () => {
			it('should call the courseExternalToolService', async () => {
				const { userId, schoolExternalToolId } = setup();

				await uc.deleteSchoolExternalTool(userId, schoolExternalToolId);

				expect(courseExternalToolService.deleteBySchoolExternalToolId).toHaveBeenCalledWith(schoolExternalToolId);
			});

			it('should call the schoolExternalToolService', async () => {
				const { userId, schoolExternalToolId } = setup();

				await uc.deleteSchoolExternalTool(userId, schoolExternalToolId);

				expect(schoolExternalToolService.deleteSchoolExternalToolById).toHaveBeenCalledWith(schoolExternalToolId);
			});
		});
	});

	describe('createSchoolExternalTool is called', () => {
		describe('when checks permission', () => {
			it('should check the permissions of the user', async () => {
				const { user, tool, schoolId } = setup();

				await uc.createSchoolExternalTool(user.id, tool);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.School,
					schoolId,
					{
						action: Actions.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});
		});

		describe('when userId and schoolExternalTool are given', () => {
			it('should call schoolExternalToolValidationService.validate()', async () => {
				const { user, tool } = setup();

				await uc.createSchoolExternalTool(user.id, tool);

				expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(tool);
			});

			it('should call schoolExternalToolService.createSchoolExternalTool', async () => {
				const { user, tool } = setup();

				await uc.createSchoolExternalTool(user.id, tool);

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(tool);
			});
		});
	});

	describe('getSchoolExternalTool is called', () => {
		describe('when checks permission', () => {
			it('should check the permissions of the user', async () => {
				const { user, schoolExternalToolId } = setup();

				await uc.getSchoolExternalTool(user.id, schoolExternalToolId);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.SchoolExternalTool,
					schoolExternalToolId,
					{
						action: Actions.read,
						requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
					}
				);
			});
		});
		describe('when userId and schoolExternalTool are given', () => {
			it('should return a schoolExternalToolDO', async () => {
				const { user, schoolExternalToolId, tool } = setup();
				schoolExternalToolService.getSchoolExternalToolById.mockResolvedValue(tool);

				const result: SchoolExternalToolDO = await uc.getSchoolExternalTool(user.id, schoolExternalToolId);

				expect(result).toEqual(tool);
			});
		});
	});

	describe('updateSchoolExternalTool is called', () => {
		const setupUpdate = () => {
			const { tool, user } = setup();
			const updatedTool: SchoolExternalToolDO = { ...tool };
			updatedTool.parameters[0].value = 'updatedValue';

			schoolExternalToolService.saveSchoolExternalTool.mockResolvedValue(updatedTool);
			return {
				updatedTool,
				schoolExternalToolId: updatedTool.id as EntityId,
				user,
			};
		};

		it('should check the permissions of the user', async () => {
			const { updatedTool, schoolExternalToolId, user } = setupUpdate();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
				user.id,
				AllowedAuthorizationEntityType.SchoolExternalTool,
				schoolExternalToolId,
				{
					action: Actions.read,
					requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
				}
			);
		});

		it('should call schoolExternalToolValidationService.validate()', async () => {
			const { updatedTool, schoolExternalToolId, user } = setupUpdate();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(updatedTool);
		});

		it('should call the service to update the tool', async () => {
			const { updatedTool, schoolExternalToolId, user } = setupUpdate();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(updatedTool);
		});

		it('should return a schoolExternalToolDO', async () => {
			const { updatedTool, schoolExternalToolId, user } = setupUpdate();

			const result: SchoolExternalToolDO = await uc.updateSchoolExternalTool(
				user.id,
				schoolExternalToolId,
				updatedTool
			);

			expect(result).toEqual(updatedTool);
		});
	});
});
