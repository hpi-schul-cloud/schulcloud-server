import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationService } from '@modules/authorization';
import { ContextExternalTool } from '@modules/tool/context-external-tool/domain';
import { contextExternalToolFactory } from '@modules/tool/context-external-tool/testing';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import { BoardNodeRule } from '../../authorisation/board-node.rule';
import {
	BoardNodeAuthorizable,
	MediaBoard,
	MediaBoardNodeFactory,
	MediaExternalToolElement,
	MediaLine,
} from '../../domain';
import { MediaBoardElementAlreadyExistsLoggableException } from '../../loggable';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodeAuthorizableService, BoardNodeService, MediaBoardService } from '../../service';
import { mediaBoardFactory, mediaExternalToolElementFactory, mediaLineFactory } from '../../testing';
import { MediaElementUc } from './media-element.uc';

describe(MediaElementUc.name, () => {
	let module: TestingModule;
	let uc: MediaElementUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let boardNodeAuthorizableService: DeepMocked<BoardNodeAuthorizableService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let mediaBoardNodeFactory: DeepMocked<MediaBoardNodeFactory>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let boardNodeRule: DeepMocked<BoardNodeRule>;

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				MediaElementUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
				},
				{
					provide: BoardNodeAuthorizableService,
					useValue: createMock<BoardNodeAuthorizableService>(),
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
					provide: MediaBoardNodeFactory,
					useValue: createMock<MediaBoardNodeFactory>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: BoardNodeRule,
					useValue: createMock<BoardNodeRule>(),
				},
			],
		}).compile();

		uc = module.get(MediaElementUc);
		authorizationService = module.get(AuthorizationService);
		boardNodeService = module.get(BoardNodeService);
		boardNodeAuthorizableService = module.get(BoardNodeAuthorizableService);
		configService = module.get(ConfigService);
		mediaBoardService = module.get(MediaBoardService);
		mediaBoardNodeFactory = module.get(MediaBoardNodeFactory);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		boardNodeRule = module.get(BoardNodeRule);
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
				const user = userFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findAnyMediaElementById.mockResolvedValueOnce(mediaElement);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canMoveElement.mockReturnValue(true);

				return {
					user,
					mediaElement,
					mediaLine,
				};
			};

			it('should find element and target line', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeService.findAnyMediaElementById).toHaveBeenCalledWith(mediaElement.id);
				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(MediaLine, mediaLine.id);
			});

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaElement } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeRule.canMoveElement).toHaveBeenCalledWith(user, mediaLine);
			});

			it('should move the element', async () => {
				const { user, mediaLine, mediaElement } = setup();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canMoveElement.mockReturnValueOnce(true);

				await uc.moveElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeService.move).toHaveBeenCalledWith(mediaElement, mediaLine, 1);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
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
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, user.school.id)
					.buildWithId();

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine).mockResolvedValueOnce(mediaBoard);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canCreateElement.mockReturnValue(true);
				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				mediaBoardService.checkElementExists.mockResolvedValueOnce(false);

				mediaBoardService.createContextExternalToolForMediaBoard.mockResolvedValueOnce(contextExternalTool);
				mediaBoardNodeFactory.buildExternalToolElement.mockReturnValueOnce(mediaElement);

				return {
					user,
					mediaElement,
					mediaLine,
					mediaBoard,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should find the line', async () => {
				const { user, mediaLine, mediaElement } = setup();

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(MediaLine, mediaLine.id);
			});

			it('should check the authorization', async () => {
				const { user, mediaLine, mediaElement } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeRule.canCreateElement).toHaveBeenCalledWith(user, mediaLine);
			});

			it('should find the board', async () => {
				const { user, mediaLine, mediaElement } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(MediaBoard, mediaLine.rootId);
			});

			it('should find the school external tool', async () => {
				const { user, mediaLine, mediaElement } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(schoolExternalToolService.findById).toHaveBeenCalledWith(mediaElement.id);
			});

			it('should check if element exists already on board', async () => {
				const { user, mediaLine, mediaElement, mediaBoard, schoolExternalTool } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(mediaBoardService.checkElementExists).toHaveBeenCalledWith(mediaBoard, schoolExternalTool);
			});

			it('should create the element', async () => {
				const { user, mediaLine, mediaElement, contextExternalTool } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(mediaBoardNodeFactory.buildExternalToolElement).toHaveBeenCalledWith({
					contextExternalToolId: contextExternalTool.id,
				});
			});

			it('should add the element to the line', async () => {
				const { user, mediaLine, mediaElement } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(boardNodeService.addToParent).toHaveBeenCalledWith(mediaLine, mediaElement, 1);
			});

			it('should return the created element', async () => {
				const { user, mediaLine, mediaElement } = setup();
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				const result: MediaExternalToolElement = await uc.createElement(user.id, mediaElement.id, mediaLine.id, 1);

				expect(result).toBe(mediaElement);
			});
		});

		describe('when the user creates an existing media element', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();
				const mediaLine = mediaLineFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, user.school.id)
					.buildWithId();

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaLine).mockResolvedValueOnce(mediaBoard);

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaLine as unknown as BoardNodeAuthorizable
				);
				boardNodeRule.canCreateElement.mockReturnValue(true);

				schoolExternalToolService.findById.mockResolvedValueOnce(schoolExternalTool);
				mediaBoardService.checkElementExists.mockResolvedValueOnce(true);

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
				boardNodeRule.canCreateElement.mockReturnValueOnce(true);

				await expect(uc.createElement(user.id, mediaElement.id, mediaLine.id, 1)).rejects.toThrow(
					new MediaBoardElementAlreadyExistsLoggableException(mediaBoard.id, schoolExternalTool.id)
				);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
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
				const user = userFactory.build();
				const mediaElement = mediaExternalToolElementFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findAnyMediaElementById.mockResolvedValueOnce(mediaElement);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				return {
					user,
					mediaElement,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaElement } = setup();
				boardNodeRule.canDeleteElement.mockReturnValueOnce(true);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaElement as unknown as BoardNodeAuthorizable
				);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				await uc.deleteElement(user.id, mediaElement.id);

				expect(boardNodeRule.canDeleteElement).toHaveBeenCalledWith(user, mediaElement);
			});

			it('should delete the element', async () => {
				const { user, mediaElement } = setup();
				boardNodeRule.canDeleteElement.mockReturnValueOnce(true);
				boardNodeAuthorizableService.getBoardAuthorizable.mockResolvedValueOnce(
					mediaElement as unknown as BoardNodeAuthorizable
				);

				await uc.deleteElement(user.id, mediaElement.id);

				expect(boardNodeService.delete).toHaveBeenCalledWith(mediaElement);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
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
