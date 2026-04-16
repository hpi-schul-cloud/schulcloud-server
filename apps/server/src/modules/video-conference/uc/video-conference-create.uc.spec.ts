import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { userDoFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	BBBBaseMeetingConfig,
	BBBCreateResponse,
	BBBMeetingInfoResponse,
	BBBResponse,
	BBBRole,
	BBBStatus,
} from '../bbb';
import { VideoConferenceDO, VideoConferenceScope } from '../domain';
import { BBBService, VideoConferenceService } from '../service';
import { VIDEO_CONFERENCE_CONFIG_TOKEN } from '../video-conference-config';
import { VideoConferenceCreateUc } from './video-conference-create.uc';
import { VideoConferenceFeatureService } from './video-conference-feature.service';

describe('VideoConferenceCreateUc', () => {
	let module: TestingModule;
	let uc: VideoConferenceCreateUc;
	let bbbService: DeepMocked<BBBService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;
	let videoConferenceFeatureService: DeepMocked<VideoConferenceFeatureService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceCreateUc,
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
				{
					provide: VIDEO_CONFERENCE_CONFIG_TOKEN,
					useValue: {
						scHostUrl: 'http://test-host',
					},
				},
			],
		}).compile();

		uc = module.get(VideoConferenceCreateUc);
		bbbService = module.get(BBBService);
		videoConferenceService = module.get(VideoConferenceService);
		videoConferenceFeatureService = module.get(VideoConferenceFeatureService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	const createBbbCreateSuccessResponse = (scopeId: string): BBBResponse<BBBCreateResponse> => {
		return {
			response: {
				returncode: BBBStatus.SUCCESS,
				messageKey: 'messageKey',
				message: 'message',
				meetingID: scopeId,
				internalMeetingID: 'internalMeetingID',
				parentMeetingID: 'parentMeetingID',
				createTime: new Date().getTime(),
				voiceBridge: 123,
				dialNumber: '4910790393',
				createDate: '2022-02-15',
				hasUserJoined: false,
				duration: 2333,
				hasBeenForciblyEnded: false,
			},
		};
	};

	describe('createIfNotRunning', () => {
		describe('when meeting is not already running', () => {
			describe('when user role is moderator', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const currentUserId = user.id as string;

					const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

					const options = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scopeInfo = {
						scopeId: scope.id,
						scopeName: VideoConferenceScope.COURSE,
						title: 'title',
						logoutUrl: 'logoutUrl',
					};

					const vcDo = new VideoConferenceDO({
						id: new ObjectId().toHexString(),
						target: scope.id,
						targetModel: scope.scope,
						options: options,
						salt: 'salt',
					});
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValueOnce(vcDo);
					videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions.mockResolvedValueOnce(vcDo);

					bbbService.getMeetingInfo.mockRejectedValueOnce(new Error('Meeting not found'));

					videoConferenceService.getScopeInfo.mockResolvedValueOnce(scopeInfo);

					videoConferenceService.determineBbbRole.mockResolvedValueOnce(BBBRole.MODERATOR);

					const bbbCreateResponse = createBbbCreateSuccessResponse(scope.id);

					return { currentUserId, scope, options, bbbCreateResponse, scopeInfo };
				};

				it('should call feature check service', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toHaveBeenCalled();
				});

				it('should call videoConferenceService.findVideoConferenceByScopeIdAndScope', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.findVideoConferenceByScopeIdAndScope).toBeCalledWith(scope.id, scope.scope);
				});

				it('should call check if meeting is running by calling bbbService.getMeetingInfo', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);
					expect(bbbService.getMeetingInfo).toBeCalledWith(new BBBBaseMeetingConfig({ meetingID: scope.id + 'salt' }));
				});

				it('should call videoConferenceService.getScopeInfo', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.getScopeInfo).toBeCalledWith(currentUserId, scope.id, scope.scope);
				});

				it('should call videoConferenceService.determineBbbRole', async () => {
					const { currentUserId, scope, options, scopeInfo } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.determineBbbRole).toBeCalledWith(currentUserId, scopeInfo.scopeId, scope.scope);
				});

				it('should call videoConferenceService.createOrUpdateVideoConferenceWithOptions', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions).toBeCalledWith(
						scope.id,
						scope.scope,
						options
					);
				});

				it('should call bbbService.create', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(bbbService.create).toBeCalled();
				});
			});

			describe('and user role is not moderator', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const currentUserId = user.id as string;

					const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

					const options = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scopeInfo = {
						scopeId: scope.id,
						scopeName: VideoConferenceScope.COURSE,
						title: 'title',
						logoutUrl: 'logoutUrl',
					};

					bbbService.getMeetingInfo.mockRejectedValueOnce(new Error('Meeting not found'));
					videoConferenceService.getScopeInfo.mockResolvedValueOnce(scopeInfo);
					videoConferenceService.determineBbbRole.mockResolvedValueOnce(BBBRole.VIEWER);
					const vcDo = new VideoConferenceDO({
						id: new ObjectId().toHexString(),
						target: scope.id,
						targetModel: scope.scope,
						options: options,
						salt: 'salt',
					});
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValueOnce(vcDo);
					videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions.mockResolvedValueOnce(vcDo);

					return { currentUserId, scope, options };
				};

				it('should throw a ForbiddenException', async () => {
					const { currentUserId, scope, options } = setup();

					const func = () => uc.createIfNotRunning(currentUserId, scope, options);

					await expect(func()).rejects.toThrow(ForbiddenException);
				});
			});
		});

		describe('when meeting is already running', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;

				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

				const options = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};

				const vcDo = new VideoConferenceDO({
					id: new ObjectId().toHexString(),
					target: scope.id,
					targetModel: scope.scope,
					options: options,
					salt: 'salt',
				});
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValueOnce(vcDo);

				videoConferenceService.determineBbbRole.mockResolvedValueOnce(BBBRole.MODERATOR);
				bbbService.getMeetingInfo.mockResolvedValueOnce({
					response: {
						running: true,
					},
				} as BBBResponse<BBBMeetingInfoResponse>);
				videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions.mockResolvedValueOnce(vcDo);

				return { user, currentUserId, scope, options };
			};

			it('should not create a new meeting', async () => {
				const { currentUserId, scope, options } = setup();

				await uc.createIfNotRunning(currentUserId, scope, options);

				expect(bbbService.create).not.toBeCalled();
			});
		});

		describe('feature check', () => {
			const setup = (scopeName: VideoConferenceScope) => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;

				const scope = {
					scope: scopeName,
					id: new ObjectId().toHexString(),
				};

				const options = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};

				const scopeInfo = {
					scopeId: scope.id,
					scopeName,
					title: 'title',
					logoutUrl: 'logoutUrl',
				};

				bbbService.getMeetingInfo.mockRejectedValueOnce(new Error('Meeting not found'));
				videoConferenceService.getScopeInfo.mockResolvedValueOnce(scopeInfo);
				videoConferenceService.determineBbbRole.mockResolvedValueOnce(BBBRole.MODERATOR);
				const vcDo = new VideoConferenceDO({
					id: new ObjectId().toHexString(),
					target: scope.id,
					targetModel: scope.scope,
					options: options,
					salt: 'salt',
				});
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValueOnce(vcDo);
				videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions.mockResolvedValueOnce(vcDo);
				return { user, currentUserId, scope, options };
			};

			it('should call the feature check service', async () => {
				const { currentUserId, scope, options } = setup(VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT);

				await uc.createIfNotRunning(currentUserId, scope, options);

				expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toBeCalledWith(currentUserId, scope);
			});
		});
	});
});
