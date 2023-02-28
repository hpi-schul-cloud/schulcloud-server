import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceController } from '@src/modules/video-conference/controller/video-conference.controller';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@src/modules/authentication';
import { VideoConferenceScope } from '@shared/domain/interface';
import {
	VideoConferenceDTO,
	VideoConferenceInfoDTO,
	VideoConferenceJoinDTO,
} from '@src/modules/video-conference/dto/video-conference.dto';
import { BBBBaseResponse, BBBCreateResponse } from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import {
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from '@src/modules/video-conference/controller/dto/video-conference.response';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import { ObjectId } from '@mikro-orm/mongodb';
import { defaultVideoConferenceOptions } from '../interface/vc-options.interface';

describe('VideoConference Controller', () => {
	let module: TestingModule;
	let service: VideoConferenceController;
	let videoConferenceUc: DeepMocked<VideoConferenceUc>;

	const currentUser: ICurrentUser = { userId: new ObjectId().toHexString() } as ICurrentUser;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceController,
				{
					provide: VideoConferenceUc,
					useValue: createMock<VideoConferenceUc>(),
				},
				VideoConferenceResponseMapper,
			],
		}).compile();
		service = module.get(VideoConferenceController);
		videoConferenceUc = module.get(VideoConferenceUc);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createAndJoin', () => {
		it('should create and return a join Response', async () => {
			// Arrange
			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.NOT_STARTED,
			} as VideoConferenceInfoDTO);
			videoConferenceUc.create.mockResolvedValue({} as VideoConferenceDTO<BBBCreateResponse>);
			videoConferenceUc.join.mockResolvedValue({ url: 'mockUrl' } as VideoConferenceJoinDTO);

			// Act
			const ret: VideoConferenceJoinResponse = await service.createAndJoin(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId',
				{
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: false,
					moderatorMustApproveJoinRequests: true,
				}
			);

			// Assert
			expect(videoConferenceUc.create).toHaveBeenCalled();
			expect(ret.url).toEqual('mockUrl');
		});

		it('should return a join Response without create', async () => {
			// Arrange
			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.RUNNING,
			} as VideoConferenceInfoDTO);
			videoConferenceUc.create.mockImplementation(() => Promise.reject());
			videoConferenceUc.join.mockResolvedValue({ url: 'mockUrl' } as VideoConferenceJoinDTO);

			// Act
			const ret: VideoConferenceJoinResponse = await service.createAndJoin(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId',
				{
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: false,
					moderatorMustApproveJoinRequests: true,
				}
			);

			// Assert
			expect(videoConferenceUc.create).not.toHaveBeenCalled();
			expect(ret.url).toEqual('mockUrl');
		});

		it('should return a join Response, call without options', async () => {
			// Arrange
			const scopeId = 'courseId';

			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.NOT_STARTED,
			} as VideoConferenceInfoDTO);
			videoConferenceUc.create.mockResolvedValue({} as VideoConferenceDTO<BBBCreateResponse>);
			videoConferenceUc.join.mockResolvedValue({ url: 'mockUrl' } as VideoConferenceJoinDTO);

			// Act
			const ret: VideoConferenceJoinResponse = await service.createAndJoin(
				currentUser,
				VideoConferenceScope.COURSE,
				scopeId,
				{}
			);

			// Assert
			expect(videoConferenceUc.create).toHaveBeenCalledWith(currentUser, VideoConferenceScope.COURSE, scopeId, {
				everyAttendeeJoinsMuted: defaultVideoConferenceOptions.everyAttendeeJoinsMuted,
				everybodyJoinsAsModerator: defaultVideoConferenceOptions.everybodyJoinsAsModerator,
				moderatorMustApproveJoinRequests: defaultVideoConferenceOptions.moderatorMustApproveJoinRequests,
			});
			expect(ret.url).toEqual('mockUrl');
		});
	});

	describe('info', () => {
		it('should return an info Response', async () => {
			// Arrange
			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.RUNNING,
			} as VideoConferenceInfoDTO);

			// Act
			const ret: VideoConferenceInfoResponse = await service.info(currentUser, VideoConferenceScope.COURSE, 'scopeId');

			// Assert
			expect(ret.state).toEqual(VideoConferenceState.RUNNING);
		});
	});

	describe('end', () => {
		it('should return a base Response', async () => {
			// Arrange
			videoConferenceUc.end.mockResolvedValue({
				state: VideoConferenceState.FINISHED,
			} as VideoConferenceDTO<BBBBaseResponse>);

			// Act
			const ret: VideoConferenceInfoResponse = await service.end(currentUser, VideoConferenceScope.COURSE, 'scopeId');

			// Assert
			expect(ret.state).toEqual(VideoConferenceState.FINISHED);
		});
	});
});
