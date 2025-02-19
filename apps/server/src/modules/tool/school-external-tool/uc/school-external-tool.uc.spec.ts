import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { SchoolService } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { userFactory } from '@testing/factory/user.factory';
import { CommonToolMetadataService } from '../../common/service/common-tool-metadata.service';
import { SchoolExternalToolService } from '../service';
import { schoolExternalToolFactory } from '../testing';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalToolUc } from './school-external-tool.uc';
import { ExternalToolService } from '../../external-tool';
import { CommonToolValidationService } from '../../common/service';
import { externalToolFactory } from '../../external-tool/testing';

describe.only('SchoolExternalToolUc', () => {
	let module: TestingModule;
	let uc: SchoolExternalToolUc;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let commonToolMetadataService: DeepMocked<CommonToolMetadataService>;
	let commonToolValidationService: DeepMocked<CommonToolValidationService>;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;

	beforeAll(async () => {
		await setupEntities([User]);
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolUc,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: CommonToolMetadataService,
					useValue: createMock<CommonToolMetadataService>(),
				},
				{
					provide: CommonToolValidationService,
					useValue: createMock<CommonToolValidationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		uc = module.get(SchoolExternalToolUc);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		externalToolService = module.get(ExternalToolService);
		commonToolMetadataService = module.get(CommonToolMetadataService);
		commonToolValidationService = module.get(CommonToolValidationService);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('findSchoolExternalTools', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const tool = schoolExternalToolFactory.buildWithId();
				const user = userFactory.buildWithId();
				const school = schoolFactory.build({ id: tool.schoolId });

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool]);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);

				return {
					user,
					tool,
					school,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, tool, school } = setup();

				await uc.findSchoolExternalTools(user.id, tool);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});

			it('should call the service', async () => {
				const { user, tool } = setup();

				await uc.findSchoolExternalTools(user.id, tool);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({ schoolId: tool.schoolId });
			});
		});

		describe('when query parameters are empty', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const emptyQuery: SchoolExternalToolQueryInput = {};

				return {
					emptyQuery,
					user,
				};
			};

			it('should not call the service', async () => {
				const { user, emptyQuery } = setup();

				await uc.findSchoolExternalTools(user.id, emptyQuery);

				expect(schoolExternalToolService.findSchoolExternalTools).not.toHaveBeenCalled();
			});

			it('should return a empty array', async () => {
				const { user, emptyQuery } = setup();

				const result = await uc.findSchoolExternalTools(user.id, emptyQuery);

				expect(result).toEqual([]);
			});
		});

		describe('when schoolId has been set', () => {
			const setup = () => {
				const tool = schoolExternalToolFactory.buildWithId();
				const user = userFactory.buildWithId();

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool, tool]);

				return {
					user,
					tool,
				};
			};

			it('should return a schoolExternalTool array', async () => {
				const { user, tool } = setup();

				const result = await uc.findSchoolExternalTools(user.id, tool);

				expect(result).toEqual([tool, tool]);
			});
		});
	});

	describe('deleteSchoolExternalTool', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const tool = schoolExternalToolFactory.buildWithId({
					schoolId: new ObjectId().toHexString(),
				});
				const user = userFactory.buildWithId();
				const school = schoolFactory.build({ id: tool.schoolId });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					user,
					schoolExternalToolId: tool.id,
					school,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, schoolExternalToolId, school } = setup();

				await uc.deleteSchoolExternalTool(user.id, schoolExternalToolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when calls services', () => {
			const setup = () => {
				const tool = schoolExternalToolFactory.buildWithId({
					schoolId: new ObjectId().toHexString(),
				});
				const user = userFactory.buildWithId();
				const school = schoolFactory.build({ id: tool.schoolId });

				schoolExternalToolService.findById.mockResolvedValueOnce(tool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					userId: user.id,
					tool,
				};
			};

			it('should delete the tool', async () => {
				const { userId, tool } = setup();

				await uc.deleteSchoolExternalTool(userId, tool.id);

				expect(schoolExternalToolService.deleteSchoolExternalTool).toHaveBeenCalledWith(tool);
			});
		});
	});

	describe('createSchoolExternalTool', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const tool = schoolExternalToolFactory.buildWithId({
					schoolId: new ObjectId().toHexString(),
				});
				const user = userFactory.buildWithId();
				const school = schoolFactory.build({ id: tool.schoolId });

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);
				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);

				return {
					user,
					tool,
					school,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, tool, school } = setup();

				await uc.createSchoolExternalTool(user.id, tool);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when userId and schoolExternalTool are given', () => {
			const setup = () => {
				const externalTool = externalToolFactory.buildWithId();
				const tool = schoolExternalToolFactory.buildWithId();
				const user = userFactory.buildWithId();

				externalToolService.findById.mockResolvedValue(externalTool);
				commonToolValidationService.validateParameters.mockReturnValueOnce([]);

				return {
					user,
					tool,
				};
			};

			it('should call schoolExternalToolService.createSchoolExternalTool', async () => {
				const { user, tool } = setup();

				await uc.createSchoolExternalTool(user.id, tool.getProps());

				expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(tool);
			});
		});
	});

	describe('getSchoolExternalTool', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const tool = schoolExternalToolFactory.buildWithId({
					schoolId: new ObjectId().toHexString(),
				});
				const user = userFactory.buildWithId();
				const school = schoolFactory.build({ id: tool.schoolId });

				schoolExternalToolService.findById.mockResolvedValue(tool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					user,
					schoolExternalToolId: tool.id,
					school,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, schoolExternalToolId, school } = setup();

				await uc.getSchoolExternalTool(user.id, schoolExternalToolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when userId and schoolExternalTool are given', () => {
			const setup = () => {
				const tool = schoolExternalToolFactory.buildWithId({
					schoolId: new ObjectId().toHexString(),
				});
				const user = userFactory.buildWithId();
				schoolExternalToolService.findById.mockResolvedValue(tool);

				return {
					user,
					tool,
					schoolExternalToolId: tool.id,
				};
			};

			it('should return a schoolExternalTool', async () => {
				const { user, schoolExternalToolId, tool } = setup();

				const result = await uc.getSchoolExternalTool(user.id, schoolExternalToolId);

				expect(result).toEqual(tool);
			});
		});
	});

	describe('updateSchoolExternalTool', () => {
		const setup = () => {
			const externalTool = externalToolFactory.buildWithId();
			const tool = schoolExternalToolFactory.buildWithId({
				schoolId: new ObjectId().toHexString(),
			});
			const updatedTool = schoolExternalToolFactory.build({ ...tool });
			updatedTool.parameters[0].value = 'updatedValue';
			const user = userFactory.buildWithId();
			const school = schoolFactory.build({ id: tool.schoolId });

			schoolExternalToolService.saveSchoolExternalTool.mockResolvedValue(updatedTool);
			authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
			schoolService.getSchoolById.mockResolvedValueOnce(school);
			externalToolService.findById.mockResolvedValue(externalTool);
			commonToolValidationService.validateParameters.mockReturnValueOnce([]);

			return {
				user,
				userId: user.id,
				updatedTool,
				school,
				schoolExternalToolId: updatedTool.id,
			};
		};

		it('should check the permissions of the user', async () => {
			const { updatedTool, schoolExternalToolId, user, school } = setup();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(authorizationService.checkPermission).toHaveBeenCalledWith(
				user,
				school,
				AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
			);
		});

		it('should call the service to update the tool', async () => {
			const { updatedTool, schoolExternalToolId, user } = setup();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool.getProps());

			expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(updatedTool);
		});

		it('should return a schoolExternalTool', async () => {
			const { updatedTool, schoolExternalToolId, user } = setup();

			const result = await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool.getProps());

			expect(result).toEqual(updatedTool);
		});
	});

	describe('getMetadataForSchoolExternalTool', () => {
		describe('when authorize user', () => {
			const setupMetadata = () => {
				const toolId = new ObjectId().toHexString();
				const tool = schoolExternalToolFactory.buildWithId({ id: toolId }, toolId);
				const userId = new ObjectId().toHexString();
				const user = userFactory.buildWithId({}, userId);
				const school = schoolFactory.build({ id: tool.schoolId });

				schoolExternalToolService.findById.mockResolvedValue(tool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					user,
					toolId: tool.id,
					school,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, toolId, school } = setupMetadata();

				await uc.getMetadataForSchoolExternalTool(user.id, toolId);

				expect(authorizationService.checkPermission).toHaveBeenCalledWith(
					user,
					school,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when externalToolId is given', () => {
			const setupMetadata = () => {
				const user = userFactory.buildWithId();
				const toolId = new ObjectId().toHexString();
				const school = schoolFactory.build({ id: new ObjectId().toHexString() });
				const schoolExternalTool = schoolExternalToolFactory.buildWithId({
					id: toolId,
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				schoolService.getSchoolById.mockResolvedValueOnce(school);

				return {
					toolId,
					user,
				};
			};

			it('should call the service to get metadata', async () => {
				const { toolId, user } = setupMetadata();

				await uc.getMetadataForSchoolExternalTool(user.id, toolId);

				expect(commonToolMetadataService.getMetadataForSchoolExternalTool).toHaveBeenCalledWith(toolId);
			});
		});
	});
});
