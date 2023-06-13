import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@src/modules/authentication';
import { VideoConferenceScope } from '@shared/domain/interface';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import { ObjectId } from '@mikro-orm/mongodb';
import { VideoConferenceDeprecatedController } from './video-conference-deprecated.controller';
import { VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';
import { VideoConferenceJoinResponse, VideoConferenceInfoResponse } from './dto/response';
import { VideoConferenceDeprecatedUc } from '../uc';
import { defaultVideoConferenceOptions } from '../interface';
import { BBBBaseResponse, BBBCreateResponse } from '../bbb';

describe('VideoConference Controller', () => {
	let module: TestingModule;
	let controller: VideoConferenceDeprecatedController;
	let videoConferenceUc: DeepMocked<VideoConferenceDeprecatedUc>;

	const currentUser: ICurrentUser = { userId: new ObjectId().toHexString() } as ICurrentUser;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceDeprecatedController,
				{
					provide: VideoConferenceDeprecatedUc,
					useValue: createMock<VideoConferenceDeprecatedUc>(),
				},
				VideoConferenceResponseMapper,
			],
		}).compile();
		controller = module.get(VideoConferenceDeprecatedController);
		videoConferenceUc = module.get(VideoConferenceDeprecatedUc);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('createAndJoin', () => {
		it('should create and return a join Response', async () => {
			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.NOT_STARTED,
			} as VideoConferenceInfo);
			videoConferenceUc.create.mockResolvedValue({} as VideoConference<BBBCreateResponse>);
			videoConferenceUc.join.mockResolvedValue({ url: 'mockUrl' } as VideoConferenceJoin);

			const ret: VideoConferenceJoinResponse = await controller.createAndJoin(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId',
				{
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: false,
					moderatorMustApproveJoinRequests: true,
				}
			);

			expect(videoConferenceUc.create).toHaveBeenCalled();
			expect(ret.url).toEqual('mockUrl');
		});

		it('should return a join Response without create', async () => {
			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.RUNNING,
			} as VideoConferenceInfo);
			videoConferenceUc.create.mockImplementation(() => Promise.reject());
			videoConferenceUc.join.mockResolvedValue({ url: 'mockUrl' } as VideoConferenceJoin);

			const ret: VideoConferenceJoinResponse = await controller.createAndJoin(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId',
				{
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: false,
					moderatorMustApproveJoinRequests: true,
				}
			);

			expect(videoConferenceUc.create).not.toHaveBeenCalled();
			expect(ret.url).toEqual('mockUrl');
		});

		it('should return a join Response, call without options', async () => {
			const scopeId = 'courseId';

			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.NOT_STARTED,
			} as VideoConferenceInfo);
			videoConferenceUc.create.mockResolvedValue({} as VideoConference<BBBCreateResponse>);
			videoConferenceUc.join.mockResolvedValue({ url: 'mockUrl' } as VideoConferenceJoin);

			const ret: VideoConferenceJoinResponse = await controller.createAndJoin(
				currentUser,
				VideoConferenceScope.COURSE,
				scopeId,
				{}
			);

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
			videoConferenceUc.getMeetingInfo.mockResolvedValue({
				state: VideoConferenceState.RUNNING,
			} as VideoConferenceInfo);

			const ret: VideoConferenceInfoResponse = await controller.info(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId'
			);

			expect(ret.state).toEqual(VideoConferenceState.RUNNING);
		});
	});

	describe('end', () => {
		it('should return a base Response', async () => {
			videoConferenceUc.end.mockResolvedValue({
				state: VideoConferenceState.FINISHED,
			} as VideoConference<BBBBaseResponse>);

			const ret: VideoConferenceInfoResponse = await controller.end(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId'
			);

			expect(ret.state).toEqual(VideoConferenceState.FINISHED);
		});
	});
});
