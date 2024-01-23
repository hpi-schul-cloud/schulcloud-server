import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContextExternalToolRepo } from '@shared/repo';
import {
	contextExternalToolFactory,
	customParameterFactory,
	externalToolFactory,
	legacySchoolDoFactory,
	schoolExternalToolFactory,
} from '@shared/testing/factory/domainobject';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { ObjectId } from '@mikro-orm/mongodb';
import { Permission } from '@shared/domain/interface';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool, ContextRef } from '../domain';
import { ContextExternalToolService } from './context-external-tool.service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { RestrictedContextMismatchLoggable } from './restricted-context-mismatch-loggabble';
import { CommonToolService } from '../../common/service';
import { CustomParameter } from '../../common/domain';

describe('ContextExternalToolService', () => {
	let module: TestingModule;
	let service: ContextExternalToolService;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let commonToolService: DeepMocked<CommonToolService>;

	let contextExternalToolRepo: DeepMocked<ContextExternalToolRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContextExternalToolService,
				{
					provide: ContextExternalToolRepo,
					useValue: createMock<ContextExternalToolRepo>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: CommonToolService,
					useValue: createMock<CommonToolService>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		commonToolService = module.get(CommonToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('findContextExternalTools', () => {
		describe('when query is given', () => {
			const setup = () => {
				const contextExternalTools: ContextExternalTool[] = contextExternalToolFactory.buildList(2);

				contextExternalToolRepo.find.mockResolvedValue(contextExternalTools);

				return {
					contextExternalTools,
				};
			};

			it('should return an array of contextExternalTools', async () => {
				const { contextExternalTools } = setup();

				const result: ContextExternalTool[] = await service.findContextExternalTools({});

				expect(result).toEqual(contextExternalTools);
			});
		});
	});

	describe('deleteBySchoolExternalToolId', () => {
		describe('when schoolExternalToolId is given', () => {
			const setup = () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const schoolExternalToolId = schoolExternalTool.id as string;
				const contextExternalTool1: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalToolId)
					.buildWithId();
				const contextExternalTool2: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalToolId)
					.buildWithId();
				contextExternalToolRepo.find.mockResolvedValueOnce([contextExternalTool1, contextExternalTool2]);

				return {
					schoolExternalTool,
					schoolExternalToolId,
					contextExternalTool1,
					contextExternalTool2,
				};
			};

			it('should call find()', async () => {
				const { schoolExternalToolId } = setup();

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({
					schoolToolRef: { schoolToolId: schoolExternalToolId },
				});
			});

			it('should call deleteBySchoolExternalToolIds()', async () => {
				const { schoolExternalToolId, contextExternalTool1, contextExternalTool2 } = setup();

				await service.deleteBySchoolExternalToolId(schoolExternalToolId);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith([contextExternalTool1, contextExternalTool2]);
			});
		});
	});

	describe('saveContextExternalTool', () => {
		describe('when contextExternalTool is given', () => {
			const setup = () => {
				jest.useFakeTimers().setSystemTime(new Date('2023-01-01'));
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				return {
					contextExternalTool,
				};
			};

			it('should call contextExternalToolRepo ', async () => {
				const { contextExternalTool } = setup();

				await service.saveContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.save).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});

	describe('findById', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const schoolId: string = legacySchoolDoFactory.buildWithId().id as string;
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					schoolId,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool } = setup();

				const result: ContextExternalTool = await service.findByIdOrFail(contextExternalTool.id as string);

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when contextExternalTool could not be found', () => {
			const setup = () => {
				contextExternalToolRepo.findById.mockRejectedValue(new NotFoundException());
			};

			it('should throw a not found exception', async () => {
				setup();

				const func = () => service.findByIdOrFail('unknownContextExternalToolId');

				await expect(func()).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('findByIdOrNull', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const schoolId: string = legacySchoolDoFactory.buildWithId().id as string;
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build({
					schoolId,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id as string, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findByIdOrNull.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool } = setup();

				const result: ContextExternalTool | null = await service.findById(contextExternalTool.id as string);

				expect(result).toEqual(contextExternalTool);
			});
		});

		describe('when contextExternalTool could not be found', () => {
			const setup = () => {
				contextExternalToolRepo.findByIdOrNull.mockResolvedValueOnce(null);
			};

			it('should throw a not found exception', async () => {
				setup();

				const result: ContextExternalTool | null = await service.findById('unknownContextExternalToolId');

				expect(result).toBeNull();
			});
		});
	});

	describe('deleteContextExternalTool', () => {
		describe('when contextExternalToolId is given', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				return {
					contextExternalTool,
				};
			};

			it('should call delete on repo', async () => {
				const { contextExternalTool } = setup();

				await service.deleteContextExternalTool(contextExternalTool);

				expect(contextExternalToolRepo.delete).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});

	describe('getContextExternalToolsForContext', () => {
		describe('when contextType and contextId are given', () => {
			it('should call the repository', async () => {
				const contextRef: ContextRef = new ContextRef({ type: ToolContextType.COURSE, id: 'contextId' });
				await service.findAllByContext(contextRef);

				expect(contextExternalToolRepo.find).toHaveBeenCalledWith({
					context: {
						id: 'contextId',
						type: ToolContextType.COURSE,
					},
				});
			});

			it('should return context external tools', async () => {
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();
				contextExternalToolRepo.find.mockResolvedValue([contextExternalTool]);

				const result: ContextExternalTool[] = await service.findAllByContext(contextExternalTool.contextRef);

				expect(result).toEqual([contextExternalTool]);
			});
		});
	});

	describe('checkContextRestrictions', () => {
		describe('when contexts are not restricted', () => {
			const setup = () => {
				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				commonToolService.isContextRestricted.mockReturnValueOnce(false);

				return {
					contextExternalTool,
					schoolExternalTool,
					externalTool,
				};
			};

			it('should find SchoolExternalTool', async () => {
				const { contextExternalTool } = setup();

				await service.checkContextRestrictions(contextExternalTool);

				expect(schoolExternalToolService.findById).toHaveBeenCalledWith(contextExternalTool.schoolToolRef.schoolToolId);
			});

			it('should find ExternalTool', async () => {
				const { contextExternalTool, schoolExternalTool } = setup();

				await service.checkContextRestrictions(contextExternalTool);

				expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});

			it('should check if context is restricted', async () => {
				const { contextExternalTool, externalTool } = setup();

				await service.checkContextRestrictions(contextExternalTool);

				expect(commonToolService.isContextRestricted).toHaveBeenCalledWith(
					externalTool,
					contextExternalTool.contextRef.type
				);
			});

			it('should not throw', async () => {
				const { contextExternalTool } = setup();

				await expect(service.checkContextRestrictions(contextExternalTool)).resolves.not.toThrow();
			});
		});

		describe('when context is restricted to correct context type', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const externalTool: ExternalTool = externalToolFactory.build({ restrictToContexts: [ToolContextType.COURSE] });
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: { type: ToolContextType.COURSE },
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				commonToolService.isContextRestricted.mockReturnValueOnce(false);

				return {
					userId,
					context,
					contextExternalTool,
				};
			};

			it('should not throw', async () => {
				const { contextExternalTool } = setup();

				await expect(service.checkContextRestrictions(contextExternalTool)).resolves.not.toThrow();
			});
		});

		describe('when context is restricted to wrong context type', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

				const externalTool: ExternalTool = externalToolFactory.build({
					restrictToContexts: [ToolContextType.BOARD_ELEMENT],
				});
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.build();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: { type: ToolContextType.COURSE },
				});

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				externalToolService.findById.mockResolvedValueOnce(externalTool);
				commonToolService.isContextRestricted.mockReturnValueOnce(true);

				return {
					userId,
					context,
					contextExternalTool,
					externalTool,
				};
			};

			it('should throw RestrictedContextMismatchLoggable', async () => {
				const { contextExternalTool, externalTool } = setup();

				await expect(service.checkContextRestrictions(contextExternalTool)).rejects.toThrow(
					new RestrictedContextMismatchLoggable(externalTool.name, contextExternalTool.contextRef.type)
				);
			});
		});
	});

	describe('copyContextExternalTool', () => {
		const setup = () => {
			const courseId: string = new ObjectId().toHexString();
			const contextCopyId: string = new ObjectId().toHexString();

			const protectedParam: CustomParameter = customParameterFactory.build({ isProtected: true });
			const unprotectedParam: CustomParameter = customParameterFactory.build();
			const externalTool: ExternalTool = externalToolFactory.buildWithId({
				parameters: [protectedParam, unprotectedParam],
			});

			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ toolId: externalTool.id });

			const unusedParam: CustomParameter = customParameterFactory.build();
			const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
				contextRef: { type: ToolContextType.COURSE, id: courseId },
				schoolToolRef: { schoolToolId: schoolExternalTool.id, schoolId: schoolExternalTool.schoolId },
				parameters: [
					{ name: protectedParam.name, value: 'paramValue1' },
					{ name: unprotectedParam.name, value: 'paramValue2' },
					{ name: unusedParam.name, value: 'paramValue3' },
				],
			});

			schoolExternalToolService.findById.mockResolvedValue(schoolExternalTool);
			externalToolService.findById.mockResolvedValue(externalTool);
			jest
				.spyOn(contextExternalToolRepo, 'save')
				.mockImplementation((tool: ContextExternalTool) => Promise.resolve(tool));

			return {
				contextCopyId,
				contextExternalTool,
				schoolExternalTool,
				unusedParam,
			};
		};

		it('should find schoolExternalTool', async () => {
			const { contextExternalTool, contextCopyId } = setup();

			await service.copyContextExternalTool(contextExternalTool, contextCopyId);

			expect(schoolExternalToolService.findById).toHaveBeenCalledWith(contextExternalTool.schoolToolRef.schoolToolId);
		});

		it('should find externalTool', async () => {
			const { contextExternalTool, contextCopyId, schoolExternalTool } = setup();

			await service.copyContextExternalTool(contextExternalTool, contextCopyId);

			expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
		});

		it('should remove values from protected parameters', async () => {
			const { contextExternalTool, contextCopyId } = setup();

			const copiedTool: ContextExternalTool = await service.copyContextExternalTool(contextExternalTool, contextCopyId);

			expect(copiedTool).toEqual<Partial<ContextExternalTool>>({
				id: undefined,
				contextRef: { id: contextCopyId, type: ToolContextType.COURSE },
				displayName: contextExternalTool.displayName,
				schoolToolRef: contextExternalTool.schoolToolRef,
				toolVersion: contextExternalTool.toolVersion,
				parameters: [
					{
						name: contextExternalTool.parameters[0].name,
						value: undefined,
					},
					{
						name: contextExternalTool.parameters[1].name,
						value: contextExternalTool.parameters[1].value,
					},
				],
			});
		});

		it('should not copy unused parameter', async () => {
			const { contextExternalTool, contextCopyId, unusedParam } = setup();

			const copiedTool: ContextExternalTool = await service.copyContextExternalTool(contextExternalTool, contextCopyId);

			expect(copiedTool.parameters.length).toEqual(2);
			expect(copiedTool.parameters).not.toContain(unusedParam);
		});

		it('should save copied tool', async () => {
			const { contextExternalTool, contextCopyId } = setup();

			await service.copyContextExternalTool(contextExternalTool, contextCopyId);

			expect(contextExternalToolRepo.save).toHaveBeenCalledWith(contextExternalTool);
		});
	});
});
