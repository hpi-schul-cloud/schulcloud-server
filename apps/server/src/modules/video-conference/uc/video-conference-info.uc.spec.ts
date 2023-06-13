import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserService } from '@src/modules/user';
import { userDoFactory } from '@shared/testing';
import { Permission, UserDO, VideoConferenceDO, VideoConferenceScope } from '@shared/domain';
import { ObjectId } from 'bson';
import { videoConferenceDOFactory } from '@shared/testing/factory/video-conference.do.factory';
import { ForbiddenException } from '@nestjs/common';
import { BBBService, VideoConferenceService } from '../service';
import { BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBStatus } from '../bbb';
import { IScopeInfo, VideoConferenceInfo, VideoConferenceState } from './dto';
import { VideoConferenceInfoUc } from './video-conference-info.uc';
import { defaultVideoConferenceOptions, VideoConferenceOptions } from '../interface';
import { ErrorStatus } from '../error/error-status.enum';

describe('VideoConferenceInfoUc', () => {
	let uc: VideoConferenceInfoUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				VideoConferenceInfoUc,
				{
					provide: BBBService,
					useValue: createMock<BBBService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: VideoConferenceService,
					useValue: createMock<VideoConferenceService>(),
				},
			],
		}).compile();

		uc = module.get<VideoConferenceInfoUc>(VideoConferenceInfoUc);
		bbbService = module.get(BBBService);
		userService = module.get(UserService);
		videoConferenceService = module.get(VideoConferenceService);
	});

	describe('getMeetingInfo', () => {
		describe('when conference is not running', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo: IScopeInfo = {
					scopeId: scope.id,
					scopeName: 'scopeName',
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

				return { user, currentUserId, scope, scopeInfo, videoConferenceDO };
			};

			it('should return video conference info with state NOT_STARTED', async () => {
				const { user, currentUserId, scope, scopeInfo, videoConferenceDO } = setup();

				userService.findById.mockResolvedValue(user);
				videoConferenceService.throwOnFeaturesDisabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
				bbbService.getMeetingInfo.mockRejectedValue(new Error('not found'));
				videoConferenceService.hasExpertRole.mockResolvedValue(true);
				videoConferenceService.canGuestJoin.mockReturnValue(true);

				const result: VideoConferenceInfo = await uc.getMeetingInfo(currentUserId, scope);

				expect(result.state).toBe(VideoConferenceState.NOT_STARTED);
			});
		});

		describe('when conference is running', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;
				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const scopeInfo: IScopeInfo = {
					scopeId: scope.id,
					scopeName: 'scopeName',
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

				userService.findById.mockResolvedValue(user);
				videoConferenceService.throwOnFeaturesDisabled.mockResolvedValue();
				videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);
				bbbService.getMeetingInfo.mockResolvedValue(bbbMeetingInfoResponse);
				videoConferenceService.hasExpertRole.mockResolvedValue(false);
				videoConferenceService.canGuestJoin.mockReturnValue(true);
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

				return { user, currentUserId, scope, scopeInfo, videoConferenceDO, bbbMeetingInfoResponse };
			};

			describe('when bbbRole is moderator', () => {
				it('should call userService.findById', async () => {
					const { user, currentUserId, scope } = setup();

					userService.findById.mockResolvedValue(user);

					await uc.getMeetingInfo(currentUserId, scope);

					expect(userService.findById).toBeCalledWith(currentUserId);
				});

				it('should call videoConferenceService.throwOnFeaturesDisabled', async () => {
					const { currentUserId, scope } = setup();

					videoConferenceService.throwOnFeaturesDisabled.mockResolvedValue();

					await uc.getMeetingInfo(currentUserId, scope);

					expect(videoConferenceService.throwOnFeaturesDisabled).toBeCalled();
				});

				it('should call videoConferenceService.getScopeInfo', async () => {
					const { currentUserId, scope, scopeInfo } = setup();

					videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);

					await uc.getMeetingInfo(currentUserId, scope);

					expect(videoConferenceService.getScopeInfo).toBeCalledWith(currentUserId, scope.id, scope.scope);
				});

				it('should call bbbService.getMeetingInfo', async () => {
					const { currentUserId, scope } = setup();

					bbbService.getMeetingInfo.mockRejectedValue(new Error('not found'));

					await uc.getMeetingInfo(currentUserId, scope);

					expect(bbbService.getMeetingInfo).toBeCalledWith({ meetingID: scope.id });
				});

				it('should call videoConferenceService.findVideoConferenceByScopeIdAndScope', async () => {
					const { currentUserId, scope, videoConferenceDO } = setup();

					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConferenceDO);

					await uc.getMeetingInfo(currentUserId, scope);

					expect(videoConferenceService.findVideoConferenceByScopeIdAndScope).toBeCalledWith(scope.id, scope.scope);
				});

				it('should return video conference info with existing options', async () => {
					const { currentUserId, scope, videoConferenceDO, bbbMeetingInfoResponse } = setup();
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

					const result: VideoConferenceInfo = await uc.getMeetingInfo(currentUserId, scope);

					expect(result).toEqual<VideoConferenceInfo>({
						state: VideoConferenceState.RUNNING,
						options: videoConferenceDO.options,
						bbbResponse: bbbMeetingInfoResponse,
						permission: Permission.START_MEETING,
					});
				});

				it('should return video conference info with default options', async () => {
					const { currentUserId, scope, bbbMeetingInfoResponse } = setup();
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockRejectedValue(new Error('not found'));

					const result: VideoConferenceInfo = await uc.getMeetingInfo(currentUserId, scope);

					expect(result).toEqual<VideoConferenceInfo>({
						state: VideoConferenceState.RUNNING,
						options: defaultVideoConferenceOptions,
						bbbResponse: bbbMeetingInfoResponse,
						permission: Permission.START_MEETING,
					});
				});
			});

			describe('when bbbRole is viewer', () => {
				describe('when user has expert role', () => {
					describe('when guest can join', () => {
						it('should return video conference info with existing options', async () => {
							const { currentUserId, scope, bbbMeetingInfoResponse } = setup();
							videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);
							videoConferenceService.hasExpertRole.mockResolvedValue(true);
							videoConferenceService.canGuestJoin.mockReturnValue(true);

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
						it('should throw ForbiddenException', async () => {
							const { currentUserId, scope } = setup();
							videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);
							videoConferenceService.hasExpertRole.mockResolvedValue(true);
							videoConferenceService.canGuestJoin.mockReturnValue(false);

							const func = () => uc.getMeetingInfo(currentUserId, scope);

							await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE));
						});
					});
				});

				describe('when user does not have expert role', () => {
					it('should return video conference info without options', async () => {
						const { currentUserId, scope, bbbMeetingInfoResponse } = setup();
						videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

						const result: VideoConferenceInfo = await uc.getMeetingInfo(currentUserId, scope);

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
	});
});
