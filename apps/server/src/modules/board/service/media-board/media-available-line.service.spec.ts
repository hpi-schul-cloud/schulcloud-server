import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { mediaBoardFactory, mediaExternalToolElementFactory } from '@modules/board/testing';
import { ExternalToolService } from '@modules/tool';
import { CustomParameterScope, ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoService } from '@modules/tool/external-tool/service';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { Page } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import { setupEntities, userFactory } from '@shared/testing';
import { MediaAvailableLine, MediaBoard, MediaExternalToolElement } from '../../domain';
import { MediaAvailableLineService } from './media-available-line.service';
import { MediaBoardService } from './media-board.service';

describe(MediaAvailableLineService.name, () => {
	let module: TestingModule;
	let service: MediaAvailableLineService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;
	let mediaBoardService: DeepMocked<MediaBoardService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				MediaAvailableLineService,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
				{
					provide: ExternalToolLogoService,
					useValue: createMock<ExternalToolLogoService>(),
				},
				{
					provide: MediaBoardService,
					useValue: createMock<MediaBoardService>(),
				},
			],
		}).compile();

		service = module.get(MediaAvailableLineService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		externalToolLogoService = module.get(ExternalToolLogoService);
		mediaBoardService = module.get(MediaBoardService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUnusedAvailableSchoolExternalTools', () => {
		describe('when there are unused tools', () => {
			const setup = () => {
				const user: User = userFactory.build();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId();
				const usedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId();

				const usedContextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(usedSchoolExternalTool.id, user.school.id)
					.buildWithId();

				const mediaExternalToolElement: MediaExternalToolElement = mediaExternalToolElementFactory.build({
					contextExternalToolId: usedContextExternalTool.id,
				});
				const board: MediaBoard = mediaBoardFactory.build({ children: [mediaExternalToolElement] });

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([
					schoolExternalTool,
					usedSchoolExternalTool,
				]);
				contextExternalToolService.findById.mockResolvedValueOnce(usedContextExternalTool);

				mediaBoardService.findMediaElements.mockReturnValueOnce([mediaExternalToolElement]);

				return { user, board, mediaExternalToolElement, schoolExternalTool };
			};

			it('should call the service to get school external tools for users school', async () => {
				const { user, board } = setup();

				await service.getUnusedAvailableSchoolExternalTools(user, board);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId: user.school?.id,
					isDeactivated: false,
				});
			});

			it('should call the service to get context external tools by board', async () => {
				const { user, board, mediaExternalToolElement } = setup();

				await service.getUnusedAvailableSchoolExternalTools(user, board);

				expect(contextExternalToolService.findById).toHaveBeenCalledWith(
					mediaExternalToolElement.contextExternalToolId
				);
			});

			it('should return the available tools', async () => {
				const { user, board, schoolExternalTool } = setup();

				const schoolExternalTools: SchoolExternalTool[] = await service.getUnusedAvailableSchoolExternalTools(
					user,
					board
				);

				expect(schoolExternalTools).toEqual([schoolExternalTool]);
			});
		});

		describe('when there are elements on board which has deleted context external tool', () => {
			const setup = () => {
				const user: User = userFactory.build();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId();
				const usedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId();

				const usedContextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(usedSchoolExternalTool.id, user.school.id)
					.buildWithId();

				const mediaExternalToolElement: MediaExternalToolElement = mediaExternalToolElementFactory.build({
					contextExternalToolId: usedContextExternalTool.id,
				});
				const mediaExternalToolElementWithDeletedTool: MediaExternalToolElement = mediaExternalToolElementFactory.build(
					{
						contextExternalToolId: new ObjectId().toHexString(),
					}
				);
				const board: MediaBoard = mediaBoardFactory.build({
					children: [mediaExternalToolElement, mediaExternalToolElementWithDeletedTool],
				});
				mediaBoardService.findMediaElements.mockReturnValueOnce([mediaExternalToolElement]);

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([
					schoolExternalTool,
					usedSchoolExternalTool,
				]);
				contextExternalToolService.findById.mockResolvedValueOnce(usedContextExternalTool);
				contextExternalToolService.findById.mockResolvedValueOnce(null);

				return { user, board, mediaExternalToolElement, schoolExternalTool };
			};

			it('should return the available tools', async () => {
				const { user, board, schoolExternalTool } = setup();

				const schoolExternalTools: SchoolExternalTool[] = await service.getUnusedAvailableSchoolExternalTools(
					user,
					board
				);

				expect(schoolExternalTools).toEqual([schoolExternalTool]);
			});
		});

		describe('when there are unused tools and are restricted by the school admin', () => {
			const setup = () => {
				const user: User = userFactory.build();

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId();
				const restrictedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId({
						availableContexts: [],
					});
				const usedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId();

				const usedContextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(usedSchoolExternalTool.id, user.school.id)
					.buildWithId();

				const mediaExternalToolElement: MediaExternalToolElement = mediaExternalToolElementFactory.build({
					contextExternalToolId: usedContextExternalTool.id,
				});
				const board: MediaBoard = mediaBoardFactory.build({ children: [mediaExternalToolElement] });

				schoolExternalToolService.findSchoolExternalTools.mockResolvedValueOnce([
					schoolExternalTool,
					restrictedSchoolExternalTool,
					usedSchoolExternalTool,
				]);
				contextExternalToolService.findById.mockResolvedValueOnce(usedContextExternalTool);

				mediaBoardService.findMediaElements.mockReturnValueOnce([mediaExternalToolElement]);

				return { user, board, mediaExternalToolElement, restrictedSchoolExternalTool, schoolExternalTool };
			};

			it('should not return the restricted tools', async () => {
				const { user, board, schoolExternalTool } = setup();

				const schoolExternalTools: SchoolExternalTool[] = await service.getUnusedAvailableSchoolExternalTools(
					user,
					board
				);

				expect(schoolExternalTools).toEqual([schoolExternalTool]);
			});
		});
	});

	describe('getAvailableExternalToolsForSchool', () => {
		describe('when there are available external tools', () => {
			const setup = () => {
				const user: User = userFactory.build();

				const deactivatedExternalTool: ExternalTool = externalToolFactory.buildWithId({ isDeactivated: true });
				const hiddenExternalTool: ExternalTool = externalToolFactory.buildWithId({ isHidden: true });
				const contextParameterExternalTool: ExternalTool = externalToolFactory
					.withCustomParameters(1, { scope: CustomParameterScope.CONTEXT })
					.buildWithId();
				const invalidRestrictedExternalTool: ExternalTool = externalToolFactory.buildWithId({
					restrictToContexts: [ToolContextType.COURSE],
				});
				const validRestrictedExternalTool: ExternalTool = externalToolFactory.buildWithId({
					restrictToContexts: [ToolContextType.MEDIA_BOARD, ToolContextType.COURSE],
				});
				const validExternalToolNew: ExternalTool = externalToolFactory.buildWithId({
					createdAt: new Date(2024, 1, 2),
					restrictToContexts: undefined,
				});
				const validExternalToolOld: ExternalTool = externalToolFactory.buildWithId({
					createdAt: new Date(2023, 1, 2),
					restrictToContexts: [],
				});
				const validAndInvalidExternalTools: Page<ExternalTool> = new Page<ExternalTool>(
					[
						validExternalToolOld,
						validExternalToolNew,
						validRestrictedExternalTool,
						deactivatedExternalTool,
						hiddenExternalTool,
						contextParameterExternalTool,
						invalidRestrictedExternalTool,
					],
					7
				);
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId({ toolId: validExternalToolNew.id });

				externalToolService.findExternalTools.mockResolvedValueOnce(validAndInvalidExternalTools);

				const board: MediaBoard = mediaBoardFactory.build();

				const expectedExternalTools: ExternalTool[] = [
					validExternalToolNew,
					validExternalToolOld,
					validRestrictedExternalTool,
				];

				return { user, board, schoolExternalTool, expectedExternalTools };
			};

			it('should call the service to get external tools', async () => {
				const { schoolExternalTool } = setup();

				await service.getAvailableExternalToolsForSchool([schoolExternalTool]);

				expect(externalToolService.findExternalTools).toHaveBeenCalledWith({ ids: [schoolExternalTool.toolId] });
			});

			it('should return all available external tools in correct order', async () => {
				const { schoolExternalTool, expectedExternalTools } = setup();

				const externalTools: ExternalTool[] = await service.getAvailableExternalToolsForSchool([schoolExternalTool]);

				expect(externalTools).toEqual(expectedExternalTools);
			});
		});
	});

	describe('matchTools', () => {
		describe('when there are matches', () => {
			const setup = () => {
				const availableExternalTools: ExternalTool[] = [
					externalToolFactory.buildWithId(),
					externalToolFactory.buildWithId(),
				];
				const schoolExternalTools: SchoolExternalTool[] = [
					schoolExternalToolFactory.buildWithId({ toolId: availableExternalTools[0].id }),
					schoolExternalToolFactory.buildWithId({ toolId: availableExternalTools[1].id }),
				];

				return { availableExternalTools, schoolExternalTools };
			};

			it('should return the matches', () => {
				const { availableExternalTools, schoolExternalTools } = setup();

				const matches: [ExternalTool, SchoolExternalTool][] = service.matchTools(
					availableExternalTools,
					schoolExternalTools
				);

				expect(matches.length).toBe(2);
				expect(matches[0]).toEqual([availableExternalTools[0], schoolExternalTools[0]]);
				expect(matches[1]).toEqual([availableExternalTools[1], schoolExternalTools[1]]);
			});
		});

		describe('when there are no matches', () => {
			const setup = () => {
				const availableExternalTools: ExternalTool[] = [
					externalToolFactory.buildWithId(),
					externalToolFactory.buildWithId(),
				];
				const schoolExternalTools: SchoolExternalTool[] = [
					schoolExternalToolFactory.buildWithId(),
					schoolExternalToolFactory.buildWithId(),
				];

				return { availableExternalTools, schoolExternalTools };
			};

			it('should return an empty array', () => {
				const { availableExternalTools, schoolExternalTools } = setup();

				const matches: [ExternalTool, SchoolExternalTool][] = service.matchTools(
					availableExternalTools,
					schoolExternalTools
				);

				expect(matches).toEqual([]);
			});
		});
	});

	describe('createMediaAvailableLine', () => {
		const setup = () => {
			const mediaBoard = mediaBoardFactory.build();
			const externalTool1: ExternalTool = externalToolFactory.withFileRecordRef().buildWithId();
			const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
			const externalTool2: ExternalTool = externalToolFactory.buildWithId();
			const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
			const availableExternalTools: [ExternalTool, SchoolExternalTool][] = [
				[externalTool1, schoolExternalTool1],
				[externalTool2, schoolExternalTool2],
			];

			const logoUrl = 'https://logo.com';
			externalToolLogoService.buildLogoUrl.mockReturnValueOnce(logoUrl);

			return {
				availableExternalTools,
				externalTool1,
				externalTool2,
				schoolExternalTool1,
				schoolExternalTool2,
				logoUrl,
				mediaBoard,
			};
		};

		it('should call the service to build the logo url', () => {
			const { availableExternalTools, externalTool1, externalTool2, mediaBoard } = setup();

			service.createMediaAvailableLine(mediaBoard, availableExternalTools);

			expect(externalToolLogoService.buildLogoUrl).toHaveBeenCalledWith(externalTool1);
			expect(externalToolLogoService.buildLogoUrl).toHaveBeenCalledWith(externalTool2);
		});

		it('should create a media available line with correct elements', () => {
			const {
				availableExternalTools,
				externalTool1,
				externalTool2,
				schoolExternalTool1,
				schoolExternalTool2,
				logoUrl,
				mediaBoard,
			} = setup();

			const line: MediaAvailableLine = service.createMediaAvailableLine(mediaBoard, availableExternalTools);

			expect(line).toEqual({
				elements: [
					{
						schoolExternalToolId: schoolExternalTool1.id,
						name: externalTool1.name,
						description: externalTool1.description,
						logoUrl,
						thumbnailUrl: externalTool1.thumbnail?.getPreviewUrl(),
					},
					{
						schoolExternalToolId: schoolExternalTool2.id,
						name: externalTool2.name,
						description: externalTool2.description,
						logoUrl: undefined,
					},
				],
				backgroundColor: mediaBoard.backgroundColor,
				collapsed: mediaBoard.collapsed,
			});
		});
	});
});
