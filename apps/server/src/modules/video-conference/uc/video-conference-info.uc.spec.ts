import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { userDoFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBStatus } from '../bbb';
import { VideoConferenceDO, VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { VideoConferenceOptions } from '../interface';
import { BBBService, VideoConferenceService } from '../service';
import { videoConferenceDOFactory } from '../testing';
import { VideoConferenceInfo, VideoConferenceState } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';
import { VideoConferenceInfoUc } from './video-conference-info.uc';

describe('VideoConferenceInfoUc', () => {
	let module: TestingModule;
	let uc: VideoConferenceInfoUc;
	let bbbService: DeepMocked<BBBService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;
	let videoConferenceFeatureService: DeepMocked<VideoConferenceFeatureService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceInfoUc,
				{
					provide: BBBService,
					useValue: createMock<BBBService>(),
				},
				{
					provide: VideoConferenceService,
					useValue: createMock<VideoConferenceService>(),
				},
				{
					provide: VideoConferenceFeatureService,
					useValue: createMock<VideoConferenceFeatureService>(),
				},
			],
		}).compile();

		uc = module.get<VideoConferenceInfoUc>(VideoConferenceInfoUc);
		bbbService = module.get(BBBService);
		videoConferenceService = module.get(VideoConferenceService);
		videoConferenceFeatureService = module.get(VideoConferenceFeatureService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const createBbbMeetingInfoSuccessResponse = (scopeId: string): BBBResponse<BBBMeetingInfoResponse> => {
		return {
			response: {
				returncode: BBBStatus.SUCCESS,
				meetingID: scopeId,
				internalMeetingID: 'internalMeetingID',
				createTime: new Date().getTime(),
				voiceBridge: 123,
				dialNumber: '4910790393',
				createDate: '2022-02-15',
				hasUserJoined: false,
				duration: 2333,
				hasBeenForciblyEnded: false,
			} as BBBMeetingInfoResponse,
		};
	};

	describe('getMeetingInfo', () => {
		describe('when conference is not running', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo = {
					scopeId: scope.id,
					scopeName: VideoConferenceScope.COURSE,
					title: 'title',
					logoutUrl: 'logoutUrl',
				};
				const videoConferenceDO = videoConferenceDOFactory.buildWithId({
					options: {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					},
				});

				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
				bbbService.getMeetingInfo.mockRejectedValue(new Error('not found'));
				videoConferenceService.hasExpertRole.mockResolvedValue(true);
				videoConferenceService.canGuestJoin.mockReturnValue(true);

				return { user, currentUserId, scope, scopeInfo, videoConferenceDO };
			};

			it('should return video conference info with state NOT_STARTED', async () => {
				const { currentUserId, scope } = setup();

				const result = await uc.getMeetingInfo(currentUserId, scope);

				expect(result.state).toBe(VideoConferenceState.NOT_STARTED);
			});
		});

		describe('when conference is running', () => {
			describe('when bbbRole is moderator', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const currentUserId = user.id as string;
					const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
					const scopeInfo = {
						scopeId: scope.id,
						scopeName: VideoConferenceScope.COURSE,
						title: 'title',
						logoutUrl: 'logoutUrl',
					};
					const videoConferenceDO = videoConferenceDOFactory.buildWithId({
						options: {
							everyAttendeeJoinsMuted: true,
							everybodyJoinsAsModerator: true,
							moderatorMustApproveJoinRequests: true,
						},
					});
					const bbbMeetingInfoResponse: BBBResponse<BBBMeetingInfoResponse> = {
						response: {
							returncode: BBBStatus.SUCCESS,
							meetingID: scope.id,
							internalMeetingID: 'internalMeetingID',
							createTime: new Date().getTime(),
							voiceBridge: 123,
							dialNumber: '4910790393',
							createDate: '2022-02-15',
							hasUserJoined: false,
							duration: 2333,
							hasBeenForciblyEnded: false,
						} as BBBMeetingInfoResponse,
					};

					videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValueOnce();
					videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
					bbbService.getMeetingInfo.mockResolvedValue(bbbMeetingInfoResponse);
					videoConferenceService.hasExpertRole.mockResolvedValue(false);
					videoConferenceService.canGuestJoin.mockReturnValue(true);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

					const salt = 'fixed-salt-for-testing';

					return { user, currentUserId, scope, scopeInfo, videoConferenceDO, bbbMeetingInfoResponse, salt };
				};

				it('should call feature check service', async () => {
					const { currentUserId, scope } = setup();

					await uc.getMeetingInfo(currentUserId, scope);

					expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toBeCalledWith(currentUserId, scope);
				});

				it('should call videoConferenceService.getScopeInfo', async () => {
					const { currentUserId, scope } = setup();

					await uc.getMeetingInfo(currentUserId, scope);

					expect(videoConferenceService.getScopeInfo).toBeCalledWith(currentUserId, scope.id, scope.scope);
				});

				it('should call bbbService.getMeetingInfo', async () => {
					const { currentUserId, scope, salt } = setup();
					bbbService.getMeetingInfo.mockRejectedValue(new Error('not found'));

					await uc.getMeetingInfo(currentUserId, scope);

					expect(bbbService.getMeetingInfo).toBeCalledWith({ meetingID: scope.id + salt });
				});

				it('should call videoConferenceService.findVideoConferenceByScopeIdAndScope', async () => {
					const { currentUserId, scope } = setup();

					await uc.getMeetingInfo(currentUserId, scope);

					expect(videoConferenceService.findVideoConferenceByScopeIdAndScope).toBeCalledWith(scope.id, scope.scope);
				});

				it('should return video conference info with existing options', async () => {
					const { currentUserId, scope, videoConferenceDO, bbbMeetingInfoResponse } = setup();

					const result = await uc.getMeetingInfo(currentUserId, scope);

					expect(result).toEqual<VideoConferenceInfo>({
						state: VideoConferenceState.RUNNING,
						options: videoConferenceDO.options,
						bbbResponse: bbbMeetingInfoResponse,
						permission: Permission.START_MEETING,
					});
				});
			});

			describe('when bbbRole is viewer', () => {
				describe('when user has expert role', () => {
					describe('when guest can join', () => {
						const setup = () => {
							const user = userDoFactory.buildWithId();
							const currentUserId = user.id as string;
							const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
							const scopeInfo = {
								scopeId: scope.id,
								scopeName: VideoConferenceScope.COURSE,
								title: 'title',
								logoutUrl: 'logoutUrl',
							};
							const videoConferenceDO: VideoConferenceDO = videoConferenceDOFactory.buildWithId({
								options: {
									everyAttendeeJoinsMuted: true,
									everybodyJoinsAsModerator: true,
									moderatorMustApproveJoinRequests: true,
								},
							});
							const bbbMeetingInfoResponse: BBBResponse<BBBMeetingInfoResponse> = createBbbMeetingInfoSuccessResponse(
								scope.id
							);

							videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
							videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
							videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
							bbbService.getMeetingInfo.mockResolvedValue(bbbMeetingInfoResponse);
							videoConferenceService.hasExpertRole.mockResolvedValue(true);
							videoConferenceService.canGuestJoin.mockReturnValue(true);
							videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

							return { currentUserId, scope, bbbMeetingInfoResponse };
						};

						it('should return video conference info with existing options', async () => {
							const { currentUserId, scope, bbbMeetingInfoResponse } = setup();

							const result: VideoConferenceInfo = await uc.getMeetingInfo(currentUserId, scope);

							expect(result).toEqual<VideoConferenceInfo>({
								state: VideoConferenceState.RUNNING,
								options: {} as VideoConferenceOptions,
								bbbResponse: bbbMeetingInfoResponse,
								permission: Permission.JOIN_MEETING,
							});
						});
					});

					describe('when guest can not join', () => {
						const setup = () => {
							const user = userDoFactory.buildWithId();
							const currentUserId = user.id as string;
							const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
							const scopeInfo = {
								scopeId: scope.id,
								scopeName: VideoConferenceScope.COURSE,
								title: 'title',
								logoutUrl: 'logoutUrl',
							};
							const videoConferenceDO = videoConferenceDOFactory.buildWithId({
								options: {
									everyAttendeeJoinsMuted: true,
									everybodyJoinsAsModerator: true,
									moderatorMustApproveJoinRequests: true,
								},
							});
							const bbbMeetingInfoResponse: BBBResponse<BBBMeetingInfoResponse> = createBbbMeetingInfoSuccessResponse(
								scope.id
							);

							videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
							videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
							videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
							bbbService.getMeetingInfo.mockResolvedValue(bbbMeetingInfoResponse);
							videoConferenceService.hasExpertRole.mockResolvedValue(true);
							videoConferenceService.canGuestJoin.mockReturnValue(false);
							videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

							return { currentUserId, scope };
						};

						it('should throw ForbiddenException', async () => {
							const { currentUserId, scope } = setup();

							const func = () => uc.getMeetingInfo(currentUserId, scope);

							await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE));
						});
					});
				});

				describe('when user does not have expert role', () => {
					const setup = () => {
						const user = userDoFactory.buildWithId();
						const currentUserId = user.id as string;
						const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
						const scopeInfo = {
							scopeId: scope.id,
							scopeName: VideoConferenceScope.COURSE,
							title: 'title',
							logoutUrl: 'logoutUrl',
						};
						const videoConferenceDO = videoConferenceDOFactory.buildWithId({
							options: {
								everyAttendeeJoinsMuted: true,
								everybodyJoinsAsModerator: true,
								moderatorMustApproveJoinRequests: true,
							},
						});
						const bbbMeetingInfoResponse = createBbbMeetingInfoSuccessResponse(scope.id);

						videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
						videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
						videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
						bbbService.getMeetingInfo.mockResolvedValue(bbbMeetingInfoResponse);
						videoConferenceService.hasExpertRole.mockResolvedValue(true);
						videoConferenceService.canGuestJoin.mockReturnValue(true);
						videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

						return { currentUserId, scope, bbbMeetingInfoResponse };
					};

					it('should return video conference info without options', async () => {
						const { currentUserId, scope, bbbMeetingInfoResponse } = setup();

						const result = await uc.getMeetingInfo(currentUserId, scope);

						expect(result).toEqual<Partial<VideoConferenceInfo>>({
							state: VideoConferenceState.RUNNING,
							options: {} as VideoConferenceOptions,
							bbbResponse: bbbMeetingInfoResponse,
							permission: Permission.JOIN_MEETING,
						});
					});
				});
			});
		});

		describe('feature check', () => {
			const setup = (scopeName: VideoConferenceScope) => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;
				const scope = { scope: scopeName, id: new ObjectId().toHexString() };
				const scopeInfo = {
					scopeId: scope.id,
					scopeName,
					title: 'title',
					logoutUrl: 'logoutUrl',
				};
				const videoConferenceDO = videoConferenceDOFactory.buildWithId({
					options: {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					},
				});

				const bbbMeetingInfoResponse = createBbbMeetingInfoSuccessResponse(scope.id);

				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
				bbbService.getMeetingInfo.mockResolvedValue(bbbMeetingInfoResponse);
				videoConferenceService.hasExpertRole.mockResolvedValue(true);
				videoConferenceService.canGuestJoin.mockReturnValue(true);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

				return { user, currentUserId, scope };
			};

			it('should call the feature check service', async () => {
				const { currentUserId, scope } = setup(VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT);

				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();

				await uc.getMeetingInfo(currentUserId, scope);

				expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toBeCalledWith(currentUserId, scope);
			});
		});
	});
});
