import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Action, AuthorizationService } from '@modules/authorization';
import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { mediaSchoolLicenseFactory } from '@modules/school-license/testing';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { externalToolFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { schoolExternalToolFactory } from '@modules/tool/school-external-tool/testing';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { mediaUserLicenseFactory } from '@modules/user-license/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { setupEntities } from '@testing/database';
import {
	MediaAvailableLine,
	MediaAvailableLineElement,
	MediaBoard,
	MediaBoardColors,
	MediaExternalToolElement,
} from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import {
	BoardNodePermissionService,
	BoardNodeService,
	MediaAvailableLineService,
	MediaBoardService,
} from '../../service';
import {
	mediaAvailableLineElementFactory,
	mediaAvailableLineFactory,
	mediaBoardFactory,
	mediaExternalToolElementFactory,
} from '../../testing';
import { MediaAvailableLineUc } from './media-available-line.uc';

describe(MediaAvailableLineUc.name, () => {
	let module: TestingModule;
	let uc: MediaAvailableLineUc;

	let authorizationService: DeepMocked<AuthorizationService>;
	let boardNodePermissionService: DeepMocked<BoardNodePermissionService>;
	let boardNodeService: DeepMocked<BoardNodeService>;
	let mediaAvailableLineService: DeepMocked<MediaAvailableLineService>;
	let configService: DeepMocked<ConfigService<MediaBoardConfig, true>>;
	let mediaBoardService: DeepMocked<MediaBoardService>;
	let mediaUserLicenseService: DeepMocked<MediaUserLicenseService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;

	beforeAll(async () => {
		await setupEntities([User]);

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
					provide: BoardNodeService,
					useValue: createMock<BoardNodeService>(),
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
				{
					provide: MediaUserLicenseService,
					useValue: createMock<MediaUserLicenseService>(),
				},
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
			],
		}).compile();

		uc = module.get(MediaAvailableLineUc);
		authorizationService = module.get(AuthorizationService);
		boardNodePermissionService = module.get(BoardNodePermissionService);
		boardNodeService = module.get(BoardNodeService);
		mediaAvailableLineService = module.get(MediaAvailableLineService);
		configService = module.get(ConfigService);
		mediaBoardService = module.get(MediaBoardService);
		mediaUserLicenseService = module.get(MediaUserLicenseService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getMediaAvailableLine', () => {
		describe('when the user request the available line', () => {
			const setup = () => {
				const config: Partial<MediaBoardConfig> = {
					FEATURE_MEDIA_SHELF_ENABLED: true,
					FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: false,
					FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: false,
				};
				configService.get.mockImplementation((key: keyof MediaBoardConfig) => config[key]);
				const user: User = userFactory.build();
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(user);

				const mediaExternalToolElement: MediaExternalToolElement = mediaExternalToolElementFactory.build();

				const mediaBoard = mediaBoardFactory.build({ children: [mediaExternalToolElement] });
				const mediaAvailableLineElement = mediaAvailableLineElementFactory.build();
				const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory
					.withElement(mediaAvailableLineElement)
					.build();

				const externalTool1: ExternalTool = externalToolFactory.build();
				const externalTool2: ExternalTool = externalToolFactory.build();
				const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });
				const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool2.id });

				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

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

				expect(boardNodeService.findByClassAndId).toHaveBeenCalledWith(MediaBoard, mediaBoard.id);
			});

			it('should check the permissions', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.read);
			});

			it('should get the user from authrorization service', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			});

			it('should call the service to get the unused available school external tools', async () => {
				const { user, mediaBoard } = setup();

				await uc.getMediaAvailableLine(user.id, mediaBoard.id);

				expect(mediaAvailableLineService.getUnusedAvailableSchoolExternalTools).toHaveBeenCalledWith(user, mediaBoard);
			});

			it('should call the service to get the unused available external tools for school', async () => {
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

				expect(line).toEqual<MediaAvailableLine>({
					collapsed: mediaBoard.collapsed,
					backgroundColor: mediaBoard.backgroundColor,
					elements: [
						{
							schoolExternalToolId: mediaAvailableLineElement.schoolExternalToolId,
							name: mediaAvailableLineElement.name,
							domain: mediaAvailableLineElement.domain,
							description: mediaAvailableLineElement.description,
							logoUrl: mediaAvailableLineElement.logoUrl,
						},
					],
				});
			});
		});

		describe('when licensing feature flag FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED is enabled', () => {
			const config: Partial<MediaBoardConfig> = {
				FEATURE_MEDIA_SHELF_ENABLED: true,
				FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: true,
				FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: false,
			};

			describe('when tool has no mediumId', () => {
				const setup = () => {
					configService.get.mockImplementation((key: keyof MediaBoardConfig) => config[key]);

					const user: User = userFactory.build();
					const mediaBoard: MediaBoard = mediaBoardFactory.build();
					const mediaAvailableLineElement: MediaAvailableLineElement = mediaAvailableLineElementFactory.build();
					const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory
						.withElement(mediaAvailableLineElement)
						.build();
					const externalTool1: ExternalTool = externalToolFactory.build();
					const externalTool2: ExternalTool = externalToolFactory.build();
					const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });
					const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool2.id });

					mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValue([]);

					boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);
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
						mediaAvailableLineElement,
					};
				};

				it('should not check license', async () => {
					const { user, mediaBoard } = setup();

					await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(mediaUserLicenseService.hasLicenseForExternalTool).not.toHaveBeenCalled();
				});

				it('should return media line', async () => {
					const { user, mediaBoard, mediaAvailableLineElement } = setup();

					const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(line).toEqual<MediaAvailableLine>({
						collapsed: mediaBoard.collapsed,
						backgroundColor: mediaBoard.backgroundColor,
						elements: [
							{
								schoolExternalToolId: mediaAvailableLineElement.schoolExternalToolId,
								name: mediaAvailableLineElement.name,
								domain: mediaAvailableLineElement.domain,
								description: mediaAvailableLineElement.description,
								logoUrl: mediaAvailableLineElement.logoUrl,
							},
						],
					});
				});
			});

			describe('when license exist', () => {
				const setup = () => {
					configService.get.mockReturnValue(true);

					const user: User = userFactory.build();
					const mediaBoard: MediaBoard = mediaBoardFactory.build();
					const mediaAvailableLineElement: MediaAvailableLineElement = mediaAvailableLineElementFactory.build();
					const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory
						.withElement(mediaAvailableLineElement)
						.build();
					const externalTool1: ExternalTool = externalToolFactory.build({ medium: { mediumId: 'mediumId' } });
					const externalTool2: ExternalTool = externalToolFactory.build();
					const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });
					const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool2.id });

					const mediaUserlicense: MediaUserLicense = mediaUserLicenseFactory.build();
					mediaUserlicense.mediumId = 'mediumId';

					mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValue([mediaUserlicense]);
					mediaUserLicenseService.hasLicenseForExternalTool.mockReturnValue(true);

					boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

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
						mediaAvailableLineElement,
					};
				};

				it('should check license', async () => {
					const { user, mediaBoard } = setup();

					await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(mediaUserLicenseService.hasLicenseForExternalTool).toHaveBeenCalled();
				});

				it('should return the available line', async () => {
					const { user, mediaBoard, mediaAvailableLineElement } = setup();

					const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(line).toEqual<MediaAvailableLine>({
						collapsed: mediaBoard.collapsed,
						backgroundColor: mediaBoard.backgroundColor,
						elements: [
							{
								schoolExternalToolId: mediaAvailableLineElement.schoolExternalToolId,
								name: mediaAvailableLineElement.name,
								domain: mediaAvailableLineElement.domain,
								description: mediaAvailableLineElement.description,
								logoUrl: mediaAvailableLineElement.logoUrl,
							},
						],
					});
				});
			});

			describe('when license does not exist', () => {
				const setup = () => {
					configService.get.mockReturnValue(true);

					const user: User = userFactory.build();
					const mediaBoard: MediaBoard = mediaBoardFactory.build();
					const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory.build();
					const externalTool1: ExternalTool = externalToolFactory.build({ medium: { mediumId: 'mediumId' } });
					const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });

					const mediaUserlicense: MediaUserLicense = mediaUserLicenseFactory.build();

					mediaUserLicenseService.getMediaUserLicensesForUser.mockResolvedValue([mediaUserlicense]);
					mediaUserLicenseService.hasLicenseForExternalTool.mockReturnValue(false);

					boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

					mediaAvailableLineService.getUnusedAvailableSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool1]);
					mediaAvailableLineService.getAvailableExternalToolsForSchool.mockResolvedValueOnce([externalTool1]);
					mediaAvailableLineService.matchTools.mockReturnValueOnce([[externalTool1, schoolExternalTool1]]);
					mediaAvailableLineService.createMediaAvailableLine.mockReturnValueOnce(mediaAvailableLine);

					return {
						user,
						mediaBoard,
					};
				};

				it('should show empty avalable line', async () => {
					const { user, mediaBoard } = setup();

					const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(line).toEqual<MediaAvailableLine>({
						collapsed: mediaBoard.collapsed,
						backgroundColor: mediaBoard.backgroundColor,
						elements: [],
					});
				});
			});
		});

		describe('when licensing feature flag FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED is enabled', () => {
			const config: Partial<MediaBoardConfig> = {
				FEATURE_MEDIA_SHELF_ENABLED: true,
				FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED: false,
				FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED: true,
			};

			describe('when tool has no mediumId', () => {
				const setup = () => {
					configService.get.mockImplementation((key: keyof MediaBoardConfig) => config[key]);

					const user: User = userFactory.build();
					const mediaBoard: MediaBoard = mediaBoardFactory.build();
					const mediaAvailableLineElement: MediaAvailableLineElement = mediaAvailableLineElementFactory.build();
					const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory
						.withElement(mediaAvailableLineElement)
						.build();
					const externalTool1: ExternalTool = externalToolFactory.build();
					const externalTool2: ExternalTool = externalToolFactory.build();
					const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });
					const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool2.id });

					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValue([]);

					boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);
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
						mediaAvailableLineElement,
					};
				};

				it('should not check license', async () => {
					const { user, mediaBoard } = setup();

					await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(mediaSchoolLicenseService.hasLicenseForExternalTool).not.toHaveBeenCalled();
				});

				it('should return media line', async () => {
					const { user, mediaBoard, mediaAvailableLineElement } = setup();

					const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(line).toEqual<MediaAvailableLine>({
						collapsed: mediaBoard.collapsed,
						backgroundColor: mediaBoard.backgroundColor,
						elements: [
							{
								schoolExternalToolId: mediaAvailableLineElement.schoolExternalToolId,
								name: mediaAvailableLineElement.name,
								domain: mediaAvailableLineElement.domain,
								description: mediaAvailableLineElement.description,
								logoUrl: mediaAvailableLineElement.logoUrl,
							},
						],
					});
				});
			});

			describe('when license exist', () => {
				const setup = () => {
					configService.get.mockReturnValue(true);

					const user: User = userFactory.build();
					const mediaBoard: MediaBoard = mediaBoardFactory.build();
					const mediaAvailableLineElement: MediaAvailableLineElement = mediaAvailableLineElementFactory.build();
					const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory
						.withElement(mediaAvailableLineElement)
						.build();
					const externalTool1: ExternalTool = externalToolFactory.build({ medium: { mediumId: 'mediumId' } });
					const externalTool2: ExternalTool = externalToolFactory.build();
					const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });
					const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool2.id });

					const mediaSchoolLicense: MediaSchoolLicense = mediaSchoolLicenseFactory.build({ mediumId: 'mediumId' });

					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValue([mediaSchoolLicense]);
					mediaSchoolLicenseService.hasLicenseForExternalTool.mockReturnValue(true);

					boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

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
						mediaAvailableLineElement,
					};
				};

				it('should check license', async () => {
					const { user, mediaBoard } = setup();

					await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(mediaSchoolLicenseService.hasLicenseForExternalTool).toHaveBeenCalled();
				});

				it('should return the available line', async () => {
					const { user, mediaBoard, mediaAvailableLineElement } = setup();

					const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(line).toEqual<MediaAvailableLine>({
						collapsed: mediaBoard.collapsed,
						backgroundColor: mediaBoard.backgroundColor,
						elements: [
							{
								schoolExternalToolId: mediaAvailableLineElement.schoolExternalToolId,
								name: mediaAvailableLineElement.name,
								domain: mediaAvailableLineElement.domain,
								description: mediaAvailableLineElement.description,
								logoUrl: mediaAvailableLineElement.logoUrl,
							},
						],
					});
				});
			});

			describe('when license does not exist', () => {
				const setup = () => {
					configService.get.mockReturnValue(true);

					const user: User = userFactory.build();
					const mediaBoard: MediaBoard = mediaBoardFactory.build();
					const mediaAvailableLine: MediaAvailableLine = mediaAvailableLineFactory.build();
					const externalTool1: ExternalTool = externalToolFactory.build({ medium: { mediumId: 'mediumId' } });
					const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.build({ toolId: externalTool1.id });

					const mediaSchoolLicense: MediaSchoolLicense = mediaSchoolLicenseFactory.build();

					mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId.mockResolvedValue([mediaSchoolLicense]);
					mediaSchoolLicenseService.hasLicenseForExternalTool.mockReturnValue(false);

					boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

					mediaAvailableLineService.getUnusedAvailableSchoolExternalTools.mockResolvedValueOnce([schoolExternalTool1]);
					mediaAvailableLineService.getAvailableExternalToolsForSchool.mockResolvedValueOnce([externalTool1]);
					mediaAvailableLineService.matchTools.mockReturnValueOnce([[externalTool1, schoolExternalTool1]]);
					mediaAvailableLineService.createMediaAvailableLine.mockReturnValueOnce(mediaAvailableLine);

					return {
						user,
						mediaBoard,
					};
				};

				it('should show empty avalable line', async () => {
					const { user, mediaBoard } = setup();

					const line: MediaAvailableLine = await uc.getMediaAvailableLine(user.id, mediaBoard.id);

					expect(line).toEqual<MediaAvailableLine>({
						collapsed: mediaBoard.collapsed,
						backgroundColor: mediaBoard.backgroundColor,
						elements: [],
					});
				});
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValue(false);

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

	describe('updateAvailableLineColor', () => {
		describe('when changes the color of the available line', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

				return {
					user,
					mediaBoard,
				};
			};

			it('should check the permission', async () => {
				const { user, mediaBoard } = setup();

				await uc.updateAvailableLineColor(user.id, mediaBoard.id, MediaBoardColors.RED);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.write);
			});

			it('should collapse the line', async () => {
				const { user, mediaBoard } = setup();

				await uc.updateAvailableLineColor(user.id, mediaBoard.id, MediaBoardColors.RED);

				expect(mediaBoardService.updateBackgroundColor).toHaveBeenCalledWith(mediaBoard, MediaBoardColors.RED);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaBoard,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaBoard } = setup();

				await expect(uc.updateAvailableLineColor(user.id, mediaBoard.id, MediaBoardColors.RED)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});

	describe('collapseAvailableLine', () => {
		describe('when changing the visibility of the available line', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(true);
				boardNodeService.findByClassAndId.mockResolvedValueOnce(mediaBoard);

				return {
					user,
					mediaBoard,
				};
			};

			it('should check the authorization', async () => {
				const { user, mediaBoard } = setup();

				await uc.collapseAvailableLine(user.id, mediaBoard.id, true);

				expect(boardNodePermissionService.checkPermission).toHaveBeenCalledWith(user.id, mediaBoard, Action.write);
			});

			it('should collapse the line', async () => {
				const { user, mediaBoard } = setup();

				await uc.collapseAvailableLine(user.id, mediaBoard.id, true);

				expect(mediaBoardService.updateCollapsed).toHaveBeenCalledWith(mediaBoard, true);
			});
		});

		describe('when the feature is disabled', () => {
			const setup = () => {
				const user = userFactory.build();
				const mediaBoard = mediaBoardFactory.build();

				configService.get.mockReturnValueOnce(false);

				return {
					user,
					mediaBoard,
				};
			};

			it('should throw an exception', async () => {
				const { user, mediaBoard } = setup();

				await expect(uc.collapseAvailableLine(user.id, mediaBoard.id, true)).rejects.toThrow(
					FeatureDisabledLoggableException
				);
			});
		});
	});
});
