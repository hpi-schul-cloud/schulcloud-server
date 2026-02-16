import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { BBBJoinConfig, BBBJoinResponse, BBBResponse, BBBRole } from '../bbb';
import { VideoConferenceScope } from '../domain';
import { ErrorStatus } from '../error';
import { VideoConferenceOptions } from '../interface';
import { BBBService, VideoConferenceService } from '../service';
import { videoConferenceDOFactory } from '../testing';
import { VIDEO_CONFERENCE_CONFIG_TOKEN } from '../video-conference-config';
import { VideoConferenceJoin, VideoConferenceState } from './dto';
import { VideoConferenceFeatureService } from './video-conference-feature.service';
import { VideoConferenceJoinUc } from './video-conference-join.uc';

describe('VideoConferenceJoinUc', () => {
	let module: TestingModule;
	let uc: VideoConferenceJoinUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;
	let videoConferenceFeatureService: DeepMocked<VideoConferenceFeatureService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceJoinUc,
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
				{
					provide: VideoConferenceFeatureService,
					useValue: createMock<VideoConferenceFeatureService>(),
				},
				{
					provide: VIDEO_CONFERENCE_CONFIG_TOKEN,
					useValue: {
						host: 'http://localhost',
						featureVideoConferenceEnabled: true,
					},
				},
			],
		}).compile();

		uc = module.get<VideoConferenceJoinUc>(VideoConferenceJoinUc);
		bbbService = module.get(BBBService);
		userService = module.get(UserService);
		videoConferenceService = module.get(VideoConferenceService);
		videoConferenceFeatureService = module.get(VideoConferenceFeatureService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('join', () => {
		describe('when join is called', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;

				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });

				const bbbJoinResponse = {
					response: {
						url: 'url',
					},
				} as BBBResponse<BBBJoinResponse>;

				userService.findById.mockResolvedValue(user);
				videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
					role: BBBRole.VIEWER,
					isGuest: false,
				});
				bbbService.join.mockResolvedValue(bbbJoinResponse.response.url);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

				return { currentUserId, scope };
			};

			it('should call bbbService.join', async () => {
				const { currentUserId, scope } = setup();

				await uc.join(currentUserId, scope);

				expect(bbbService.join).toHaveBeenCalled();
			});

			it('should call userService.findById', async () => {
				const { currentUserId, scope } = setup();

				await uc.join(currentUserId, scope);

				expect(userService.findById).toHaveBeenCalled();
			});

			it('should call videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb', async () => {
				const { currentUserId, scope } = setup();

				await uc.join(currentUserId, scope);

				expect(videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb).toHaveBeenCalled();
			});

			it('should call videoConferenceService.findVideoConferenceByScopeIdAndScope', async () => {
				const { currentUserId, scope } = setup();

				await uc.join(currentUserId, scope);

				expect(videoConferenceService.findVideoConferenceByScopeIdAndScope).toHaveBeenCalled();
			});
		});

		describe('when user is a guest', () => {
			describe('and waiting room is not enabled', () => {
				const setup = () => {
					const user = userDoFactory.buildWithId();
					const currentUserId = user.id as string;

					const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
					const options: VideoConferenceOptions = {
						everyAttendeeJoinsMuted: true,
						everybodyJoinsAsModerator: true,
						moderatorMustApproveJoinRequests: false,
					};
					const videoConference = videoConferenceDOFactory.build({ options });

					const bbbJoinResponse = {
						response: {
							url: 'url',
						},
					} as BBBResponse<BBBJoinResponse>;

					userService.findById.mockResolvedValue(user);
					videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
						role: BBBRole.VIEWER,
						isGuest: true,
					});
					bbbService.join.mockResolvedValue(bbbJoinResponse.response.url);
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

					return { currentUserId, scope };
				};

				it('should throw a ForbiddenException', async () => {
					const { currentUserId, scope } = setup();

					const func = () => uc.join(currentUserId, scope);

					await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE));
				});
			});

			describe('and waiting room is enabled', () => {
				describe('and everybodyJoinsAsModerator is true', () => {
					const setup = () => {
						const user = userDoFactory.buildWithId();
						const currentUserId = user.id as string;

						const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
						const options: VideoConferenceOptions = {
							everyAttendeeJoinsMuted: true,
							everybodyJoinsAsModerator: true,
							moderatorMustApproveJoinRequests: true,
						};
						const videoConference = videoConferenceDOFactory.build({ options });

						const bbbJoinResponse = {
							response: {
								url: 'url',
							},
						} as BBBResponse<BBBJoinResponse>;

						userService.findById.mockResolvedValue(user);
						videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
							role: BBBRole.VIEWER,
							isGuest: true,
						});
						videoConferenceService.sanitizeString.mockReturnValue(`${user.firstName} ${user.lastName}`);
						bbbService.join.mockResolvedValue(bbbJoinResponse.response.url);
						videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

						return { user, currentUserId, scope, options, bbbJoinResponse };
					};

					it('should return a video conference join with url from bbb', async () => {
						const { currentUserId, scope, bbbJoinResponse } = setup();

						const result = await uc.join(currentUserId, scope);

						expect(result).toEqual(
							expect.objectContaining<Partial<VideoConferenceJoin>>({ url: bbbJoinResponse.response.url })
						);
					});

					it('should call join with guest true', async () => {
						const { currentUserId, scope, user } = setup();

						await uc.join(currentUserId, scope);

						expect(bbbService.join).toHaveBeenCalledWith({
							fullName: `${user.firstName} ${user.lastName}`,
							meetingID: scope.id + 'fixed-salt-for-testing',
							role: BBBRole.VIEWER,
							userID: currentUserId,
							guest: true,
						});
					});
				});

				describe('and everybodyJoinsAsModerator is false', () => {
					const setup = () => {
						const user = userDoFactory.buildWithId();
						const currentUserId = user.id as string;

						const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
						const options = {
							everyAttendeeJoinsMuted: true,
							everybodyJoinsAsModerator: false,
							moderatorMustApproveJoinRequests: true,
						};
						const videoConference = videoConferenceDOFactory.build({ options });

						const bbbJoinResponse: BBBResponse<BBBJoinResponse> = {
							response: {
								url: 'url',
							},
						} as BBBResponse<BBBJoinResponse>;

						userService.findById.mockResolvedValue(user);
						videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
							role: BBBRole.VIEWER,
							isGuest: true,
						});
						videoConferenceService.sanitizeString.mockReturnValue(`${user.firstName} ${user.lastName}`);
						bbbService.join.mockResolvedValue(bbbJoinResponse.response.url);
						videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

						return { user, currentUserId, scope, options, bbbJoinResponse };
					};

					it('should call join with guest true', async () => {
						const { currentUserId, scope, user } = setup();

						await uc.join(currentUserId, scope);

						expect(bbbService.join).toHaveBeenCalledWith({
							fullName: `${user.firstName} ${user.lastName}`,
							meetingID: scope.id + 'fixed-salt-for-testing',
							role: BBBRole.VIEWER,
							userID: currentUserId,
							guest: true,
						});
					});
				});
			});
		});

		describe('when user is not a guest', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;

				const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
				const options = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });

				const bbbJoinResponse = {
					response: {
						url: 'url',
					},
				} as BBBResponse<BBBJoinResponse>;

				userService.findById.mockResolvedValue(user);
				videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
					role: BBBRole.VIEWER,
					isGuest: false,
				});
				videoConferenceService.sanitizeString.mockReturnValue(`${user.firstName} ${user.lastName}`);
				bbbService.join.mockResolvedValue(bbbJoinResponse.response.url);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

				return { currentUserId, scope, bbbJoinResponse, user };
			};

			it('should return a video conference join with url from bbb', async () => {
				const { currentUserId, scope, bbbJoinResponse } = setup();

				const result = await uc.join(currentUserId, scope);

				expect(result).toEqual<VideoConferenceJoin>({
					url: bbbJoinResponse.response.url,
					permission: Permission.JOIN_MEETING,
					state: VideoConferenceState.RUNNING,
				});
			});

			it('should join a video conference as a moderator', async () => {
				const { currentUserId, scope } = setup();

				await uc.join(currentUserId, scope);

				expect(bbbService.join).toBeCalledWith(
					expect.objectContaining<Partial<BBBJoinConfig>>({ role: BBBRole.MODERATOR })
				);
			});

			it('should call join without guest property', async () => {
				const { currentUserId, scope, user } = setup();

				await uc.join(currentUserId, scope);

				expect(bbbService.join).toHaveBeenCalledWith({
					fullName: `${user.firstName} ${user.lastName}`,
					meetingID: scope.id + 'fixed-salt-for-testing',
					role: BBBRole.MODERATOR,
					userID: currentUserId,
				});
			});
		});

		describe('feature check', () => {
			const setup = (scopeName: VideoConferenceScope) => {
				const user = userDoFactory.buildWithId();
				const currentUserId = user.id as string;
				const scope = { scope: scopeName, id: new ObjectId().toHexString() };
				const options: VideoConferenceOptions = {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: true,
				};
				const videoConference = videoConferenceDOFactory.build({ options });

				const bbbJoinResponse = {
					response: {
						url: 'url',
					},
				} as BBBResponse<BBBJoinResponse>;

				userService.findById.mockResolvedValue(user);
				videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
					role: BBBRole.VIEWER,
					isGuest: false,
				});
				videoConferenceService.sanitizeString.mockReturnValue(`${user.firstName} ${user.lastName}`);
				bbbService.join.mockResolvedValue(bbbJoinResponse.response.url);
				videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

				return { user, currentUserId, scope };
			};

			it('should call the feature check service', async () => {
				const { currentUserId, scope } = setup(VideoConferenceScope.VIDEO_CONFERENCE_ELEMENT);

				videoConferenceFeatureService.checkVideoConferenceFeatureEnabled.mockResolvedValue();

				await uc.join(currentUserId, scope);

				expect(videoConferenceFeatureService.checkVideoConferenceFeatureEnabled).toBeCalledWith(currentUserId, scope);
			});
		});
	});
});
