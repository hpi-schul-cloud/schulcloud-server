import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Actions, EntityId, Permission, User } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { SchoolExternalToolUc } from './school-external-tool.uc';
import { AuthorizationService } from '../../authorization';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { CourseExternalToolService } from '../service/course-external-tool.service';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';

describe('SchoolExternalToolUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: SchoolExternalToolUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let courseExternalToolService: DeepMocked<CourseExternalToolService>;

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
			],
		}).compile();

		uc = module.get(SchoolExternalToolUc);
		authorizationService = module.get(AuthorizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		courseExternalToolService = module.get(CourseExternalToolService);
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
		const school: SchoolDO = schoolDOFactory.build({ id: tool.schoolId });
		return {
			user,
			userId: user.id,
			tool,
			schoolExternalToolId: tool.id as EntityId,
			school,
		};
	};

	describe('findSchoolExternalTools is called', () => {
		describe('when checks permission', () => {
			it('should check the permissions of the user', async () => {
				const { user, tool, school } = setup();

				await uc.findSchoolExternalTools(user.id, tool);

				expect(authorizationService.checkPermissionByReferences).toHaveBeenCalledWith(
					user.id,
					AllowedAuthorizationEntityType.School,
					school.id,
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
});
