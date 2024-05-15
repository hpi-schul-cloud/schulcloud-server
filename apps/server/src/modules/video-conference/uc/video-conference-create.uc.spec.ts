import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject';
import {} from '@shared/domain/entity';
import { VideoConferenceScope } from '@shared/domain/interface';
import { userDoFactory } from '@shared/testing/factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { BBBCreateResponse, BBBMeetingInfoResponse, BBBResponse, BBBRole, BBBStatus } from '../bbb';
import { ErrorStatus } from '../error/error-status.enum';
import { VideoConferenceOptions } from '../interface';
import { BBBService, VideoConferenceService } from '../service';
import { ScopeInfo, ScopeRef } from './dto';
import { VideoConferenceCreateUc } from './video-conference-create.uc';

describe('VideoConferenceCreateUc', () => {
	let module: TestingModule;
	let uc: VideoConferenceCreateUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
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
		describe('when meeting is not running', () => {
			describe('when user role is moderator', () => {
				const setup = () => {
					const user: UserDO = userDoFactory.buildWithId();
					const currentUserId: string = user.id as string;

					const scope: ScopeRef = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

					const options: VideoConferenceOptions = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scopeInfo: ScopeInfo = {
						scopeId: scope.id,
						scopeName: 'scopeName',
						title: 'title',
						logoutUrl: 'logoutUrl',
					};

					const bbbCreateResponse: BBBResponse<BBBCreateResponse> = createBbbCreateSuccessResponse(scope.id);

					bbbService.getMeetingInfo.mockRejectedValue(new Error('Meeting not found'));
					userService.findById.mockResolvedValue(user);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);
					videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);

					return { currentUserId, scope, options, bbbCreateResponse, scopeInfo };
				};

				it('should call videoConferenceService.throwOnFeaturesDisabled', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(videoConferenceService.throwOnFeaturesDisabled).toHaveBeenCalled();
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

				it('should call bbbService.create', async () => {
					const { currentUserId, scope, options } = setup();

					await uc.createIfNotRunning(currentUserId, scope, options);

					expect(bbbService.create).toBeCalled();
				});
			});

			describe('and user role is not moderator', () => {
				const setup = () => {
					const user: UserDO = userDoFactory.buildWithId();
					const currentUserId: string = user.id as string;

					const scope: ScopeRef = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };

					const options: VideoConferenceOptions = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: true,
					};

					const scopeInfo: ScopeInfo = {
						scopeId: scope.id,
						scopeName: 'scopeName',
						title: 'title',
						logoutUrl: 'logoutUrl',
					};

					bbbService.getMeetingInfo.mockRejectedValue(new Error('Meeting not found'));
					userService.findById.mockResolvedValue(user);
					videoConferenceService.getScopeInfo.mockResolvedValue(scopeInfo);
					videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.VIEWER);

					return { currentUserId, scope, options };
				};

				it('should throw a ForbiddenException', async () => {
					const { currentUserId, scope, options } = setup();

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

				videoConferenceService.determineBbbRole.mockResolvedValue(BBBRole.MODERATOR);
				bbbService.getMeetingInfo.mockResolvedValue({
					response: {
						running: true,
					},
				} as BBBResponse<BBBMeetingInfoResponse>);

				return { user, currentUserId, scope, options };
			};

			it('should not create a new meeting', async () => {
				const { currentUserId, scope, options } = setup();

				await uc.createIfNotRunning(currentUserId, scope, options);

				expect(bbbService.create).not.toBeCalled();
			});
		});
	});
});
