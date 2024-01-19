import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContextBuilder } from '@modules/authorization';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { schoolExternalToolFactory, setupEntities, userFactory } from '@shared/testing';
import { CommonToolMetadataService } from '../../common/service/common-tool-metadata.service';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../service';
import { SchoolExternalToolQueryInput } from './dto/school-external-tool.types';
import { SchoolExternalToolUc } from './school-external-tool.uc';

describe('SchoolExternalToolUc', () => {
	let module: TestingModule;
	let uc: SchoolExternalToolUc;

	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let schoolExternalToolValidationService: DeepMocked<SchoolExternalToolValidationService>;
	let toolPermissionHelper: DeepMocked<ToolPermissionHelper>;
	let commonToolMetadataService: DeepMocked<CommonToolMetadataService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolUc,
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: SchoolExternalToolValidationService,
					useValue: createMock<SchoolExternalToolValidationService>(),
				},
				{
					provide: ToolPermissionHelper,
					useValue: createMock<ToolPermissionHelper>(),
				},
				{
					provide: CommonToolMetadataService,
					useValue: createMock<CommonToolMetadataService>(),
				},
			],
		}).compile();

		uc = module.get(SchoolExternalToolUc);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		schoolExternalToolValidationService = module.get(SchoolExternalToolValidationService);
		toolPermissionHelper = module.get(ToolPermissionHelper);
		commonToolMetadataService = module.get(CommonToolMetadataService);
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
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool]);

				return {
					user,
					tool,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, tool } = setup();

				await uc.findSchoolExternalTools(user.id, tool);

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					user.id,
					tool,
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
				const user: User = userFactory.buildWithId();
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

				const result: SchoolExternalTool[] = await uc.findSchoolExternalTools(user.id, emptyQuery);

				expect(result).toEqual([]);
			});
		});

		describe('when schoolId has been set', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([tool, tool]);

				return {
					user,
					tool,
				};
			};

			it('should return a schoolExternalTool array', async () => {
				const { user, tool } = setup();

				const result: SchoolExternalTool[] = await uc.findSchoolExternalTools(user.id, tool);

				expect(result).toEqual([tool, tool]);
			});
		});
	});

	describe('deleteSchoolExternalTool', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				return {
					user,
					tool,
					schoolExternalToolId: tool.id as EntityId,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, tool, schoolExternalToolId } = setup();

				await uc.deleteSchoolExternalTool(user.id, schoolExternalToolId);

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					user.id,
					tool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when calls services', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				return {
					userId: user.id,
					schoolExternalToolId: tool.id as EntityId,
				};
			};

			it('should call the courseExternalToolService', async () => {
				const { userId, schoolExternalToolId } = setup();

				await uc.deleteSchoolExternalTool(userId, schoolExternalToolId);

				expect(contextExternalToolService.deleteBySchoolExternalToolId).toHaveBeenCalledWith(schoolExternalToolId);
			});

			it('should call the schoolExternalToolService', async () => {
				const { userId, schoolExternalToolId } = setup();

				await uc.deleteSchoolExternalTool(userId, schoolExternalToolId);

				expect(schoolExternalToolService.deleteSchoolExternalToolById).toHaveBeenCalledWith(schoolExternalToolId);
			});
		});
	});

	describe('createSchoolExternalTool', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				return {
					user,
					tool,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, tool } = setup();

				await uc.createSchoolExternalTool(user.id, tool);

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					user.id,
					tool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when userId and schoolExternalTool are given', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				return {
					user,
					tool,
				};
			};

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

	describe('getSchoolExternalTool', () => {
		describe('when checks permission', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();

				schoolExternalToolService.findById.mockResolvedValue(tool);

				return {
					user,
					tool,
					schoolExternalToolId: tool.id as EntityId,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, schoolExternalToolId, tool } = setup();

				await uc.getSchoolExternalTool(user.id, schoolExternalToolId);

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					user.id,
					tool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when userId and schoolExternalTool are given', () => {
			const setup = () => {
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const user: User = userFactory.buildWithId();
				schoolExternalToolService.findById.mockResolvedValue(tool);

				return {
					user,
					tool,
					schoolExternalToolId: tool.id as EntityId,
				};
			};

			it('should return a schoolExternalTool', async () => {
				const { user, schoolExternalToolId, tool } = setup();

				const result: SchoolExternalTool = await uc.getSchoolExternalTool(user.id, schoolExternalToolId);

				expect(result).toEqual(tool);
			});
		});
	});

	describe('updateSchoolExternalTool', () => {
		const setup = () => {
			const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
			const updatedTool: SchoolExternalTool = schoolExternalToolFactory.build({ ...tool });
			updatedTool.parameters[0].value = 'updatedValue';
			const user: User = userFactory.buildWithId();

			schoolExternalToolService.saveSchoolExternalTool.mockResolvedValue(updatedTool);

			return {
				user,
				userId: user.id,
				updatedTool,
				schoolId: tool.schoolId,
				schoolExternalToolId: updatedTool.id as EntityId,
			};
		};

		it('should check the permissions of the user', async () => {
			const { updatedTool, schoolExternalToolId, user } = setup();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
				user.id,
				updatedTool,
				AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
			);
		});

		it('should call schoolExternalToolValidationService.validate()', async () => {
			const { updatedTool, schoolExternalToolId, user } = setup();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(schoolExternalToolValidationService.validate).toHaveBeenCalledWith(updatedTool);
		});

		it('should call the service to update the tool', async () => {
			const { updatedTool, schoolExternalToolId, user } = setup();

			await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(schoolExternalToolService.saveSchoolExternalTool).toHaveBeenCalledWith(updatedTool);
		});

		it('should return a schoolExternalTool', async () => {
			const { updatedTool, schoolExternalToolId, user } = setup();

			const result: SchoolExternalTool = await uc.updateSchoolExternalTool(user.id, schoolExternalToolId, updatedTool);

			expect(result).toEqual(updatedTool);
		});
	});

	describe('getMetadataForSchoolExternalTool', () => {
		describe('when authorize user', () => {
			const setupMetadata = () => {
				const toolId = new ObjectId().toHexString();
				const tool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ id: toolId }, toolId);
				const userId: string = new ObjectId().toHexString();
				const user: User = userFactory.buildWithId({}, userId);

				schoolExternalToolService.findById.mockResolvedValue(tool);

				return {
					user,
					tool,
				};
			};

			it('should check the permissions of the user', async () => {
				const { user, tool } = setupMetadata();

				await uc.getMetadataForSchoolExternalTool(user.id, tool.id!);

				expect(toolPermissionHelper.ensureSchoolPermissions).toHaveBeenCalledWith(
					user.id,
					tool,
					AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN])
				);
			});
		});

		describe('when externalToolId is given', () => {
			const setupMetadata = () => {
				const user: User = userFactory.buildWithId();

				const toolId: string = new ObjectId().toHexString();

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
