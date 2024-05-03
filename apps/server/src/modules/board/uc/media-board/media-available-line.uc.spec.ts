import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationService } from '@modules/authorization';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	MediaAvailableLine,
	MediaAvailableLineElement,
	MediaBoard,
	MediaExternalToolElement,
} from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import {
	externalToolFactory,
	mediaAvailableLineElementFactory,
	mediaAvailableLineFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
	schoolExternalToolFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaAvailableLineService, MediaBoardService } from '../../service';
import { MediaAvailableLineUc } from './media-available-line.uc';
import { BoardNodePermissionService } from '../../poc/service';

describe(MediaAvailableLineUc.name, () => {
	let module: TestingModule;
	let uc: MediaAvailableLineUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let mediaAvailableLineService: DeepMocked<MediaAvailableLineService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;
	let mediaBoardService: DeepMocked<MediaBoardService>;

	beforeAll(async () => {
		await setupEntities();

		module = await Test.createTestingModule({
			providers: [
				MediaAvailableLineUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: BoardNodePermissionService,
					useValue: createMock<BoardNodePermissionService>(),
				},
				{
					provide: MediaAvailableLineService,
					useValue: createMock<MediaAvailableLineService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: MediaBoardService,
					useValue: createMock<MediaBoardService>(),
				},
			],
		}).compile();

		uc = module.get(MediaAvailableLineUc);
		authorizationService = module.get(AuthorizationService);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		mediaAvailableLineService = module.get(MediaAvailableLineService);
		configService = module.get(ConfigService);
		mediaBoardService = module.get(MediaBoardService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getMediaAvailableLine', () => {
		describe('when the user request the available line', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(true);

				const user: User = userFactory.build();
				const mediaExternalToolElement: MediaExternalToolElement = mediaExternalToolElementFactory.build();
				const mediaBoard: MediaBoard = mediaBoardFactory.addChild(mediaExternalToolElement).build();
				const mediaAvailableLineElement: MediaAvailableLineElement = mediaAvailableLineElementFactory.build();
				const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory
					.withElement(mediaAvailableLineElement)
					.build();
				const externalTool1: ExternalTool = externalToolFactory.build();
				const externalTool2: ExternalTool = externalToolFactory.build();
				const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });
				const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool2.id });

				mediaBoardService.findById.mockResolvedValueOnce(mediaBoard);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				mediaAvailableLineService.getUnusedAvailableSchoolExternalTools.mockResolvedValueOnce([
					schoolExternalTool1,
					schoolExternalTool2,
				]);
				mediaAvailableLineService.getAvailableExternalToolsForSchool.mockResolvedValueOnce([
					externalTool1,
					externalTool2,
				]);
				mediaAvailableLineService.matchTools.mockReturnValueOnce([
					[externalTool1, schoolExternalTool1],
					[externalTool2, schoolExternalTool2],
				]);
				mediaAvailableLineService.createMediaAvailableLine.mockReturnValueOnce(mediaAvailableLine);

				return {
					user,
					mediaBoard,
					schoolExternalTool1,
					schoolExternalTool2,
					externalTool1,
					externalTool2,
					mediaExternalToolElement,
					mediaAvailableLineElement,
				};
			};

			it('should call the service to get media board', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(mediaBoardService.findById).toHaveBeenCalledWith(mediaBoard.id);
			});

			it('should check the authorization', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.read);
			});

			it('should call the service to get the unused available school external tools', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(mediaAvailableLineService.getUnusedAvailableSchoolExternalTools).toHaveBeenCalledWith(user, mediaBoard);
			});

			it('should call the service to get the unused available school external tools', async () => {
				const { user, mediaBoard, schoolExternalTool1, schoolExternalTool2 } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(mediaAvailableLineService.getAvailableExternalToolsForSchool).toHaveBeenCalledWith([
					schoolExternalTool1,
					schoolExternalTool2,
				]);
			});

			it('should call the service to match the tools', async () => {
				const { user, mediaBoard, externalTool1, externalTool2, schoolExternalTool1, schoolExternalTool2 } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(mediaAvailableLineService.matchTools).toHaveBeenCalledWith(
					[externalTool1, externalTool2],
					[schoolExternalTool1, schoolExternalTool2]
				);
			});

			it('should call the service to create the available line', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(mediaAvailableLineService.createMediaAvailableLine).toHaveBeenCalled();
			});

			it('should return the available line', async () => {
				const { user, mediaBoard, mediaAvailableLineElement } = setup();

				const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(line).toEqual({
					elements: [
						{
							schoolExternalToolId: mediaAvailableLineElement.schoolExternalToolId,
							name: mediaAvailableLineElement.name,
							description: mediaAvailableLineElement.description,
							logoUrl: mediaAvailableLineElement.logoUrl,
						},
					],
				});
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(false);

				const userId = new ObjectId().toHexString();
				const mediaBoardId = new ObjectId().toHexString();

				return {
					userId,
					mediaBoardId,
				};
			};

			it('should throw an exception', async () => {
				const { userId, mediaBoardId } = setup();

				await expect(uc.getMediaAvailableLine(userId, mediaBoardId)).rejects.toThrowError(
					FeatureDisabledLoggableException
				);
			});
		});
	});
});
