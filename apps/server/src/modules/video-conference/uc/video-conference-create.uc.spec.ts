import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserService } from '@src/modules/user';
import { userDoFactory } from '@shared/testing';
import { UserDO, VideoConferenceScope } from '@shared/domain';
import { ObjectId } from 'bson';
import { ForbiddenException } from '@nestjs/common';
import { VideoConferenceCreateUc } from './video-conference-create.uc';
import { BBBService, VideoConferenceService } from '../service';
import { VideoConferenceOptions } from '../interface';
import { BBBCreateResponse, BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBStatus } from '../bbb';
import { IScopeInfo, ScopeRef } from './dto';
import { ErrorStatus } from '../error/error-status.enum';

describe('VideoConferenceCreateUc', () => {
	let uc: VideoConferenceCreateUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				VideoConferenceCreateUc,
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

		uc = module.get<VideoConferenceCreateUc>(VideoConferenceCreateUc);
		bbbService = module.get(BBBService);
		userService = module.get(UserService);
		videoConferenceService = module.get(VideoConferenceService);
	});

	describe('createIfNotRunning', () => {
		describe('when meeting is not running', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;

				const scope: ScopeRef = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};

				const bbbCreateResponse: BBBResponse<BBBCreateResponse> = {
					response: {
						returncode: BBBStatus.SUCCESS,
						messageKey: 'messageKey',
						message: 'message',
						meetingID: scope.id,
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

				bbbService.getMeetingInfo.mockRejectedValue(new Error('Meeting not found'));

				return { user, currentUserId, scope, options, bbbCreateResponse };
			};

			describe('and user role is moderator', () => {
				it('should call videoConferenceService.throwOnFeaturesDisabled', async () => {
					const { user, currentUserId, scope, options } = setup();
					userService.findById.mockResolvedValue(user);
					const expectedException = new ForbiddenException(ErrorStatus.SCHOOL_FEATURE_DISABLED);
					videoConferenceService.throwOnFeaturesDisabled.mockRejectedValue(expectedException);

					const func = () => uc.createIfNotRunning(currentUserId, scope, options);

					await expect(func()).rejects.toThrow(expectedException);
				});

				it('should call videoConferenceService.createOrUpdateVideoConferenceWithOptions', async () => {
					const { user, currentUserId, scope, options } = setup();

					userService.findById.mockResolvedValue(user);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.createOrUpdateVideoConferenceForScopeWithOptions).toBeCalledWith(
						scope.id,
						scope.scope,
						options
					);
				});

				it('should call videoConferenceService.getScopeInfo', async () => {
					const { user, currentUserId, scope, options } = setup();

					userService.findById.mockResolvedValue(user);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.getScopeInfo).toBeCalledWith(currentUserId, scope.id, scope.scope);
				});

				it('should call videoConferenceService.determineBbbRole', async () => {
					const { user, currentUserId, scope, options } = setup();

					userService.findById.mockResolvedValue(user);
					const scopeInfo: IScopeInfo = {
						scopeId: scope.id,
						scopeName: 'scopeName',
						title: 'title',
						logoutUrl: 'logoutUrl',
					};
					videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.determineBbbRole).toBeCalledWith(currentUserId, scopeInfo.scopeId, scope.scope);
				});

				it('should call bbbService.create', async () => {
					const { user, currentUserId, scope, options } = setup();

					userService.findById.mockResolvedValue(user);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(bbbService.create).toBeCalled();
				});
			});

			describe('and user role is not moderator', () => {
				it('should throw a ForbiddenException', async () => {
					const { currentUserId, scope, options } = setup();
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

					const func = () => uc.createIfNotRunning(currentUserId, scope, options);

					await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.INSUFFICIENT_PERMISSION));
				});
			});
		});

		describe('when meeting is running', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.buildWithId();
				const currentUserId: string = user.id as string;

				const scope: ScopeRef = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};

				bbbService.getMeetingInfo.mockResolvedValue({
					response: {
						running: true,
					},
				} as BBBResponse<BBBMeetingInfoResponse>);

				return { user, currentUserId, scope, options };
			};

			it('should not create a new meeting', async () => {
				const { currentUserId, scope, options } = setup();
				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);
				bbbService.getMeetingInfo.mockResolvedValue({
					response: {
						running: true,
					},
				} as BBBResponse<BBBMeetingInfoResponse>);

				await uc.createIfNotRunning(currentUserId, scope, options);

				expect(bbbService.create).not.toBeCalled();
			});
		});
	});
});
