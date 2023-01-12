import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, Permission, User } from '@shared/domain';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { setupEntities, userFactory } from '@shared/testing';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { AuthorizationService } from '../../authorization';
import { AllowedAuthorizationEntityType } from '../../authorization/interfaces';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalToolUc } from './school-external-tool.uc';

describe('SchoolExternalToolUc', () => {
	let module: TestingModule;
	let orm: MikroORM;
	let uc: SchoolExternalToolUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;

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
			],
		}).compile();

		uc = module.get(SchoolExternalToolUc);
		authorizationService = module.get(AuthorizationService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
	});

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const setup = () => {
		const tool: SchoolExternalToolDO = schoolExternalToolDOFactory.build();
		const user: User = userFactory.buildWithId();

		return {
			user,
			userId: user.id,
			tool,
			schoolId: tool.schoolId,
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
});
