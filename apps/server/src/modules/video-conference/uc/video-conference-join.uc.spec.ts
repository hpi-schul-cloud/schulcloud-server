import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserService } from '@src/modules/user';
import { userDoFactory } from '@shared/testing';
import { Permission, UserDO, VideoConferenceDO, VideoConferenceScope } from '@shared/domain';
import { ObjectId } from 'bson';
import { ForbiddenException } from '@nestjs/common';
import { videoConferenceDOFactory } from '@shared/testing/factory/video-conference.do.factory';
import { BBBService, VideoConferenceService } from '../service';
import { VideoConferenceOptions } from '../interface';
import { BBBJoinConfig, BBBJoinResponse, BBBResponse, BBBRole } from '../bbb';
import { VideoConferenceJoin, VideoConferenceState } from './dto';
import { ErrorStatus } from '../error/error-status.enum';
import { VideoConferenceJoinUc } from './video-conference-join.uc';

describe('VideoConferenceJoinUc', () => {
	let uc: VideoConferenceJoinUc;
	let bbbService: DeepMocked<BBBService>;
	let userService: DeepMocked<UserService>;
	let videoConferenceService: DeepMocked<VideoConferenceService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
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
			],
		}).compile();

		uc = module.get<VideoConferenceJoinUc>(VideoConferenceJoinUc);
		bbbService = module.get(BBBService);
		userService = module.get(UserService);
		videoConferenceService = module.get(VideoConferenceService);
	});

	describe('join', () => {
		const setup = () => {
			const user: UserDO = userDoFactory.buildWithId();
			const currentUserId: string = user.id as string;

			const scope = { scope: VideoConferenceScope.COURSE, id: new ObjectId().toHexString() };
			const options: VideoConferenceOptions = {
				everyAttendeeJoinsMuted: true,
				everybodyJoinsAsModerator: true,
				moderatorMustApproveJoinRequests: true,
			};
			const videoConference: VideoConferenceDO = videoConferenceDOFactory.build({ options });

			return { user, currentUserId, scope, videoConference, options };
		};

		it('should call bbbService.join', async () => {
			const { user, currentUserId, scope } = setup();
			const bbbJoinResponse: BBBResponse<BBBJoinResponse> = {
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

			await uc.join(currentUserId, scope);

			expect(bbbService.join).toHaveBeenCalled();
		});

		it('should call userService.findById', async () => {
			const { user, currentUserId, scope } = setup();

			userService.findById.mockResolvedValue(user);
			videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
				role: BBBRole.VIEWER,
				isGuest: false,
			});
			bbbService.join.mockResolvedValue('url');

			await uc.join(currentUserId, scope);

			expect(userService.findById).toHaveBeenCalled();
		});

		it('should call videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb', async () => {
			const { user, currentUserId, scope } = setup();

			userService.findById.mockResolvedValue(user);
			videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
				role: BBBRole.VIEWER,
				isGuest: false,
			});
			bbbService.join.mockResolvedValue('url');

			await uc.join(currentUserId, scope);

			expect(videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb).toHaveBeenCalled();
		});

		it('should call videoConferenceService.findVideoConferenceByScopeIdAndScope', async () => {
			const { currentUserId, scope, videoConference } = setup();

			videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
				role: BBBRole.VIEWER,
				isGuest: false,
			});
			videoConference.options.everybodyJoinsAsModerator = true;
			videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

			await uc.join(currentUserId, scope);

			expect(videoConferenceService.findVideoConferenceByScopeIdAndScope).toHaveBeenCalled();
		});

		describe('when user is a guest', () => {
			describe('and waiting room is not enabled', () => {
				it('should throw a ForbiddenException', async () => {
					const { currentUserId, scope, videoConference } = setup();
					videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
						role: BBBRole.VIEWER,
						isGuest: true,
					});
					videoConference.options.moderatorMustApproveJoinRequests = false;
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

					const func = () => uc.join(currentUserId, scope);

					await expect(func()).rejects.toThrow(new ForbiddenException(ErrorStatus.GUESTS_CANNOT_JOIN_CONFERENCE));
				});
			});

			describe('and waiting room is enabled', () => {
				it('should return a video conference join with url from bbb', async () => {
					const { currentUserId, scope, videoConference } = setup();
					videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
						role: BBBRole.VIEWER,
						isGuest: true,
					});
					videoConference.options.moderatorMustApproveJoinRequests = true;
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);
					const expectedUrl = 'url';
					bbbService.join.mockResolvedValue(expectedUrl);

					const result: VideoConferenceJoin = await uc.join(currentUserId, scope);

					expect(result).toEqual(expect.objectContaining<Partial<VideoConferenceJoin>>({ url: expectedUrl }));
				});
			});
		});

		describe('when user is not a guest', () => {
			it('should return a video conference join with url from bbb', async () => {
				const { user, currentUserId, scope } = setup();
				const bbbJoinResponse: BBBResponse<BBBJoinResponse> = {
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

				const result: VideoConferenceJoin = await uc.join(currentUserId, scope);

				expect(result).toEqual<VideoConferenceJoin>({
					url: bbbJoinResponse.response.url,
					permission: Permission.JOIN_MEETING,
					state: VideoConferenceState.RUNNING,
				});
			});

			describe('when everybody joins as moderator is enabled', () => {
				it('should join a video conference as a moderator', async () => {
					const { currentUserId, scope, videoConference } = setup();

					videoConferenceService.getUserRoleAndGuestStatusByUserIdForBbb.mockResolvedValue({
						role: BBBRole.VIEWER,
						isGuest: false,
					});
					videoConference.options.everybodyJoinsAsModerator = true;
					videoConferenceService.findVideoConferenceByScopeIdAndScope.mockResolvedValue(videoConference);

					await uc.join(currentUserId, scope);

					expect(bbbService.join).toBeCalledWith(
						expect.objectContaining<Partial<BBBJoinConfig>>({ role: BBBRole.MODERATOR })
					);
				});
			});
		});
	});
});
