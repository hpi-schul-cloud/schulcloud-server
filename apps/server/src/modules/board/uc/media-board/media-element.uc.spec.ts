import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ContextExternalTool } from '@modules//tool/context-external-tool/domain';
import { Action, AuthorizationService } from '@modules/authorization';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	contextExternalToolFactory,
	schoolExternalToolFactory,
	setupEntities,
	userFactory as userEntityFactory,
} from '@shared/testing';
import { MediaExternalToolElement } from '../../domain';
import { MediaBoardElementAlreadyExistsLoggableException } from '../../loggable';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodePermissionService, MediaBoardService, MediaElementService, MediaLineService } from '../../service';
import { mediaBoardFactory, mediaExternalToolElementFactory, mediaLineFactory } from '../../testing';
import { MediaElementUc } from './media-element.uc';

describe(MediaElementUc.name, () => {
	let module: TestingModule;
	let uc: MediaElementUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let mediaLineService: DeepMocked<MediaLineService>;
	let mediaElementService: DeepMocked<MediaElementService>;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				MediaElementUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: MediaLineService,
					useValue: createMock<MediaLineService>(),
				},
				{
					provide: MediaElementService,
					useValue: createMock<MediaElementService>(),
				},
				{
					provide: BoardNodePermissionService,
					useValue: createMock<BoardNodePermissionService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: MediaBoardService,
					useValue: createMock<MediaBoardService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(MediaElementUc);
		authorizationService = module.get(AuthorizationService);
		mediaLineService = module.get(MediaLineService);
		mediaElementService = module.get(MediaElementService);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		configService = module.get(ConfigService);
		mediaBoardService = module.get(MediaBoardService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('moveElement', () => {
		describe('when the user moves a media element', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(true);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);
				mediaElementService.findById.mockResolvedValueOnce(mediaElement);

				return {
					user,
					mediaElement,
					mediaLine,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaLine, Action.write);
			});

			it('should move the element', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(mediaElementService.move).toHaveBeenCalledWith(mediaElement, mediaLine, 1);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaElement,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await expect(uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});

	describe('createElement', () => {
		describe('when the user creates a not existing media element', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, user.school.id)
					.buildWithId();

				configService.get.mockReturnValueOnce(true);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findByDescendant.mockResolvedValueOnce(mediaBoard);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				mediaElementService.checkElementExists.mockResolvedValueOnce(false);
				mediaElementService.createContextExternalToolForMediaBoard.mockResolvedValueOnce(contextExternalTool);
				mediaElementService.createExternalToolElement.mockResolvedValueOnce(mediaElement);

				return {
					user,
					mediaElement,
					mediaLine,
					mediaBoard,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaLine, Action.write);
			});

			it('should check if element exists already on board', async () => {
				const { user, mediaLine, mediaElement, mediaBoard, schoolExternalTool } = setup();

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(mediaElementService.checkElementExists).toHaveBeenCalledWith(mediaBoard, schoolExternalTool);
			});

			it('should create the element', async () => {
				const { user, mediaLine, mediaElement, contextExternalTool } = setup();

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(mediaElementService.createExternalToolElement).toHaveBeenCalledWith(mediaLine, 1, contextExternalTool);
			});

			it('should return the created element', async () => {
				const { user, mediaLine, mediaElement } = setup();

				const result: MediaExternalToolElement = await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(result).toBe(mediaElement);
			});
		});

		describe('when the user creates an existing media element', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, user.school.id)
					.buildWithId();

				configService.get.mockReturnValueOnce(true);
				mediaLineService.findById.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				mediaBoardService.findByDescendant.mockResolvedValueOnce(mediaBoard);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				mediaElementService.checkElementExists.mockResolvedValueOnce(true);

				return {
					user,
					mediaElement,
					mediaLine,
					mediaBoard,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaBoard, mediaLine, mediaElement, schoolExternalTool } = setup();

				await expect(uc.createElement(user.id, mediaElement.id, mediaLine.id, 1)).rejects.toThrow(
					new MediaBoardElementAlreadyExistsLoggableException(mediaBoard.id, schoolExternalTool.id)
				);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaElement,
					mediaLine,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await expect(uc.createElement(user.id, mediaElement.id, mediaLine.id, 1)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});

	describe('deleteElement', () => {
		describe('when the user deletes a media element', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(true);
				mediaElementService.findById.mockResolvedValueOnce(mediaElement);

				return {
					user,
					mediaElement,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaElement } = setup();

				await uc.deleteElement(user.id, mediaElement.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaElement, Action.write);
			});

			it('should delete the element', async () => {
				const { user, mediaElement } = setup();

				await uc.deleteElement(user.id, mediaElement.id);

				expect(mediaElementService.delete).toHaveBeenCalledWith(mediaElement);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userEntityFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaElement,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaElement } = setup();

				await expect(uc.deleteElement(user.id, mediaElement.id)).rejects.toThrow(FeatureDisabledLoggableException);
			});
		});
	});
});
