import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolService } from '@modules/tool';
import { CustomParameterScope, ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolLogoService } from '@modules/tool/external-tool/service';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaAvailableLine, MediaBoard, MediaExternalToolElement, Page } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import {
	contextExternalToolFactory,
	externalToolFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	schoolExternalToolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { MediaAvailableLineService } from './media-available-line.service';

describe(MediaAvailableLineService.name, () => {
	let module: TestingModule;
	let service: MediaAvailableLineService;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;
	let externalToolLogoService: DeepMocked<ExternalToolLogoService>;

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
			],
		}).compile();

		service = module.get(MediaAvailableLineService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
		externalToolLogoService = module.get(ExternalToolLogoService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getUnusedAvailableSchoolExternalTools', () => {
		const setup = () => {
			const user: User = userFactory.build();

			const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
				.withSchoolId(user.school.id)
				.buildWithId();
			const usedSchoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
				.withSchoolId(user.school.id)
				.buildWithId();

			const usedContextExternalTool: ContextExternalTool = contextExternalToolFactory
				.withSchoolExternalToolRef(usedSchoolExternalTool.id as string, user.school.id)
				.buildWithId();

			const mediaExternalToolElement: MediaExternalToolElement = mediaExternalToolElementFactory.build({
				contextExternalToolId: usedContextExternalTool.id,
			});
			const board: MediaBoard = mediaBoardFactory.addChild(mediaExternalToolElement).build();

			schoolExternalToolService.findSchoolExternalTools.mockResolvedValue([schoolExternalTool, usedSchoolExternalTool]);
			contextExternalToolService.findByIdOrFail.mockResolvedValueOnce(usedContextExternalTool);

			return { user, board, mediaExternalToolElement, schoolExternalTool };
		};

		describe('when there are unused tools', () => {
			it('should call the service to get school external tools for users school', async () => {
				const { user, board } = setup();

				await service.getUnusedAvailableSchoolExternalTools(user, board);

				expect(schoolExternalToolService.findSchoolExternalTools).toHaveBeenCalledWith({
					schoolId: user.school?.id,
				});
			});

			it('should call the service to get context external tools by board', async () => {
				const { user, board, mediaExternalToolElement } = setup();

				await service.getUnusedAvailableSchoolExternalTools(user, board);

				expect(contextExternalToolService.findByIdOrFail).toHaveBeenCalledWith(
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
				const restrictedExternalTool: ExternalTool = externalToolFactory.buildWithId({
					restrictToContexts: [ToolContextType.MEDIA_BOARD_ELEMENT],
				});
				const validExternalToolNew: ExternalTool = externalToolFactory.buildWithId({ createdAt: new Date(2024, 1, 2) });
				const validExternalToolOld: ExternalTool = externalToolFactory.buildWithId({ createdAt: new Date(2023, 1, 2) });
				const validAndInvalidExternalTools: Page<ExternalTool> = new Page<ExternalTool>(
					[
						validExternalToolOld,
						validExternalToolNew,
						deactivatedExternalTool,
						hiddenExternalTool,
						contextParameterExternalTool,
						restrictedExternalTool,
					],
					6
				);
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory
					.withSchoolId(user.school.id)
					.buildWithId({ toolId: validExternalToolNew.id });

				externalToolService.findExternalTools.mockResolvedValueOnce(validAndInvalidExternalTools);

				const board: MediaBoard = mediaBoardFactory.build();

				return { user, board, schoolExternalTool, validExternalToolNew, validExternalToolOld };
			};

			it('should call the service to get external tools', async () => {
				const { schoolExternalTool } = setup();

				await service.getAvailableExternalToolsForSchool([schoolExternalTool]);

				expect(externalToolService.findExternalTools).toHaveBeenCalledWith({ ids: [schoolExternalTool.toolId] });
			});

			it('should return all available external tools in correct order', async () => {
				const { schoolExternalTool, validExternalToolNew, validExternalToolOld } = setup();

				const externalTools: ExternalTool[] = await service.getAvailableExternalToolsForSchool([schoolExternalTool]);

				expect(externalTools).toEqual([validExternalToolNew, validExternalToolOld]);
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
			const externalTool1: ExternalTool = externalToolFactory.buildWithId();
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
			};
		};

		it('should call the service to build the logo url', () => {
			const { availableExternalTools, externalTool1, externalTool2 } = setup();

			service.createMediaAvailableLine(availableExternalTools);

			expect(externalToolLogoService.buildLogoUrl).toHaveBeenCalledWith(
				'/v3/tools/external-tools/{id}/logo',
				externalTool1
			);
			expect(externalToolLogoService.buildLogoUrl).toHaveBeenCalledWith(
				'/v3/tools/external-tools/{id}/logo',
				externalTool2
			);
		});

		it('should create a media available line with correct elements', () => {
			const {
				availableExternalTools,
				externalTool1,
				externalTool2,
				schoolExternalTool1,
				schoolExternalTool2,
				logoUrl,
			} = setup();

			const line: MediaAvailableLine = service.createMediaAvailableLine(availableExternalTools);

			expect(line).toEqual({
				elements: [
					{
						schoolExternalToolId: schoolExternalTool1.id,
						name: externalTool1.name,
						description: externalTool1.description,
						logoUrl,
					},
					{
						schoolExternalToolId: schoolExternalTool2.id,
						name: externalTool2.name,
						description: externalTool2.description,
						logoUrl: undefined,
					},
				],
			});
		});
	});
});
