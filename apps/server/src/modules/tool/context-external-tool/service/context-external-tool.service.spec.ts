import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { legacySchoolDoFactory } from '@modules/legacy-school/testing';
import { School } from '@modules/school';
import { schoolFactory } from '@modules/school/testing';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { CustomParameter } from '../../common/domain';
import { ToolContextType } from '../../common/enum';
import { CommonToolDeleteService, CommonToolService } from '../../common/service';
import { ExternalToolService } from '../../external-tool';
import { ExternalTool } from '../../external-tool/domain';
import { customParameterFactory, externalToolFactory } from '../../external-tool/testing';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalTool, SchoolExternalToolRef } from '../../school-external-tool/domain';
import { schoolExternalToolFactory } from '../../school-external-tool/testing';
import {
	ContextExternalTool,
	ContextExternalToolProps,
	ContextRef,
	CopyContextExternalToolRejectData,
	RestrictedContextMismatchLoggableException,
} from '../domain';
import { ContextExternalToolRepo } from '../repo/mikro-orm';
import { contextExternalToolFactory } from '../testing';
import { ContextExternalToolService } from './context-external-tool.service';

describe(ContextExternalToolService.name, () => {
	let module: TestingModule;
	let service: ContextExternalToolService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let commonToolService: DeepMocked<CommonToolService>;
	let commonToolDeleteService: DeepMocked<CommonToolDeleteService>;
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
				{
					provide: CommonToolDeleteService,
					useValue: createMock<CommonToolDeleteService>(),
				},
			],
		}).compile();

		service = module.get(ContextExternalToolService);
		contextExternalToolRepo = module.get(ContextExternalToolRepo);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		commonToolService = module.get(CommonToolService);
		commonToolDeleteService = module.get(CommonToolDeleteService);
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

	describe('deleteContextExternalTool', () => {
		describe('when deleting a context external tool', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();

				return {
					contextExternalTool,
				};
			};

			it('should delete the context external tool', async () => {
				const { contextExternalTool } = setup();

				await service.deleteContextExternalTool(contextExternalTool);

				expect(commonToolDeleteService.deleteContextExternalTool).toHaveBeenCalledWith(contextExternalTool);
			});
		});
	});

	describe('deleteContextExternalToolsByCourseId', () => {
		describe('when deleting a context external tool', () => {
			const setup = () => {
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.build();
				const courseId = contextExternalTool.contextRef.id;

				return {
					courseId,
				};
			};

			it('should delete the context external tool', async () => {
				const { courseId } = setup();

				await service.deleteContextExternalToolsByCourseId(courseId);

				expect(commonToolDeleteService.deleteContextExternalToolsByCourseId).toHaveBeenCalledWith(courseId);
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
					.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findById.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool } = setup();

				const result: ContextExternalTool = await service.findByIdOrFail(contextExternalTool.id);

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
					.withSchoolExternalToolRef(schoolExternalTool.id, schoolExternalTool.schoolId)
					.build();

				contextExternalToolRepo.findByIdOrNull.mockResolvedValue(contextExternalTool);

				return {
					contextExternalTool,
				};
			};

			it('should return a contextExternalTool', async () => {
				const { contextExternalTool } = setup();

				const result: ContextExternalTool | null = await service.findById(contextExternalTool.id);

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
				const schoolExternalTool = schoolExternalToolFactory.build();
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
				const schoolExternalTool = schoolExternalToolFactory.build();
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
				const schoolExternalTool = schoolExternalToolFactory.build();
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
					new RestrictedContextMismatchLoggableException(externalTool.name, contextExternalTool.contextRef.type)
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

			const schoolExternalTool = schoolExternalToolFactory.buildWithId({
				toolId: externalTool.id,
			});

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

		describe('when the tool to copy is from the same school', () => {
			it('should find schoolExternalTool', async () => {
				const { contextExternalTool, contextCopyId, schoolExternalTool } = setup();

				await service.copyContextExternalTool(contextExternalTool, contextCopyId, schoolExternalTool.schoolId);

				expect(schoolExternalToolService.findById).toHaveBeenCalledWith(contextExternalTool.schoolToolRef.schoolToolId);
			});

			it('should find externalTool', async () => {
				const { contextExternalTool, contextCopyId, schoolExternalTool } = setup();

				await service.copyContextExternalTool(contextExternalTool, contextCopyId, schoolExternalTool.schoolId);

				expect(externalToolService.findById).toHaveBeenCalledWith(schoolExternalTool.toolId);
			});

			it('should remove values from protected parameters', async () => {
				const { contextExternalTool, contextCopyId, schoolExternalTool } = setup();

				let copiedTool: ContextExternalTool | CopyContextExternalToolRejectData = await service.copyContextExternalTool(
					contextExternalTool,
					contextCopyId,
					schoolExternalTool.schoolId
				);

				expect(copiedTool instanceof ContextExternalTool).toEqual(true);
				copiedTool = copiedTool as ContextExternalTool;

				expect(copiedTool).toEqual(
					expect.objectContaining<ContextExternalToolProps>({
						id: expect.any(String),
						contextRef: { id: contextCopyId, type: ToolContextType.COURSE },
						displayName: contextExternalTool.displayName,
						schoolToolRef: contextExternalTool.schoolToolRef,
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
					})
				);
			});

			it('should not copy unused parameter', async () => {
				const { contextExternalTool, contextCopyId, unusedParam, schoolExternalTool } = setup();

				let copiedTool: ContextExternalTool | CopyContextExternalToolRejectData = await service.copyContextExternalTool(
					contextExternalTool,
					contextCopyId,
					schoolExternalTool.schoolId
				);

				expect(copiedTool instanceof ContextExternalTool).toEqual(true);
				copiedTool = copiedTool as ContextExternalTool;

				expect(copiedTool.parameters.length).toEqual(2);
				expect(copiedTool.parameters).not.toContain(unusedParam);
			});

			it('should save copied tool', async () => {
				const { contextExternalTool, contextCopyId, schoolExternalTool } = setup();

				await service.copyContextExternalTool(contextExternalTool, contextCopyId, schoolExternalTool.schoolId);

				expect(contextExternalToolRepo.save).toHaveBeenCalledWith(
					new ContextExternalTool({ ...contextExternalTool.getProps(), id: expect.any(String) })
				);
			});
		});

		describe('when the tool to copy is from another school', () => {
			describe('when the target school has the correct school external tool', () => {
				const setupTools = () => {
					const { contextCopyId, contextExternalTool, schoolExternalTool } = setup();
					const sourceSchoolTool = schoolExternalTool;

					const targetSchool: School = schoolFactory.build();
					const targetSchoolExternalTool = schoolExternalToolFactory.buildWithId({
						toolId: sourceSchoolTool.toolId,
						schoolId: targetSchool.id,
					});

					schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([targetSchoolExternalTool]);

					const expectedSchoolToolRef: SchoolExternalToolRef = {
						schoolToolId: targetSchoolExternalTool.id,
						schoolId: targetSchool.id,
					};

					return {
						contextCopyId,
						contextExternalTool,
						targetSchool,
						targetSchoolExternalTool,
						expectedSchoolToolRef,
					};
				};

				it('should find the correct SchoolExternalTool for the target school', async () => {
					const { contextExternalTool, contextCopyId, targetSchool, targetSchoolExternalTool } = setupTools();

					await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
						toolId: targetSchoolExternalTool.toolId,
						schoolId: targetSchool.id,
					});
				});

				it('should return the copied tool as type ContextExternalTool', async () => {
					const { contextExternalTool, contextCopyId, targetSchool } = setupTools();

					const copiedTool: ContextExternalTool | CopyContextExternalToolRejectData =
						await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(copiedTool instanceof ContextExternalTool).toEqual(true);
				});

				it('should assign the copied tool the correct school tool', async () => {
					const { contextExternalTool, contextCopyId, targetSchool, expectedSchoolToolRef } = setupTools();

					let copiedTool: ContextExternalTool | CopyContextExternalToolRejectData =
						await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(copiedTool instanceof ContextExternalTool).toEqual(true);
					copiedTool = copiedTool as ContextExternalTool;

					expect(copiedTool.schoolToolRef).toMatchObject(expectedSchoolToolRef);
				});

				it('should saved the copied tool with correct school tool', async () => {
					const { contextExternalTool, contextCopyId, expectedSchoolToolRef, targetSchool } = setupTools();

					await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(contextExternalToolRepo.save).toBeCalledWith(
						new ContextExternalTool({
							...contextExternalTool.getProps(),
							schoolToolRef: expectedSchoolToolRef,
							id: expect.any(String),
						})
					);
				});
			});

			describe('when the target school does no have the correct school external tool', () => {
				const setupTools = () => {
					const { contextCopyId, contextExternalTool, schoolExternalTool } = setup();

					const targetSchool: School = schoolFactory.build();

					schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([]);

					return {
						contextCopyId,
						contextExternalTool,
						targetSchool,
						sourceSchoolTool: schoolExternalTool,
					};
				};

				it('should find the correct SchoolExternalTool for the target school', async () => {
					const { contextExternalTool, contextCopyId, targetSchool, sourceSchoolTool } = setupTools();

					await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
						toolId: sourceSchoolTool.toolId,
						schoolId: targetSchool.id,
					});
				});

				it('should return an object type CopyContextExternalToolRejectData', async () => {
					const { contextExternalTool, contextCopyId, targetSchool } = setupTools();

					const copiedTool: ContextExternalTool | CopyContextExternalToolRejectData =
						await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(copiedTool instanceof CopyContextExternalToolRejectData).toEqual(true);
				});

				it('should not save the copied tool to the database', async () => {
					const { contextExternalTool, contextCopyId, targetSchool } = setupTools();

					await service.copyContextExternalTool(contextExternalTool, contextCopyId, targetSchool.id);

					expect(contextExternalToolRepo.save).not.toBeCalled();
				});
			});
		});
	});
});
