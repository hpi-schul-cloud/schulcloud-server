import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceScope } from '@shared/domain/interface';
import { currentUserFactory } from '@shared/testing';
import { BBBBaseResponse, BBBCreateResponse } from '../bbb';
import { defaultVideoConferenceOptions } from '../interface';
import { VideoConferenceDeprecatedUc } from '../uc';
import { VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';
import {
	DeprecatedVideoConferenceInfoResponse,
	DeprecatedVideoConferenceJoinResponse,
} from './dto/response/video-conference-deprecated.response';
import { VideoConferenceDeprecatedController } from './video-conference-deprecated.controller';

describe('VideoConferenceDeprecatedController', () => {
	let module: TestingModule;
	let controller: VideoConferenceDeprecatedController;
	let videoConferenceUc: DeepMocked<VideoConferenceDeprecatedUc>;

	const currentUser = currentUserFactory.build();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VideoConferenceDeprecatedController,
				{
					provide: VideoConferenceDeprecatedUc,
					useValue: createMock<VideoConferenceDeprecatedUc>(),
				},
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

			const ret: DeprecatedVideoConferenceJoinResponse = await controller.createAndJoin(
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

			const ret: DeprecatedVideoConferenceJoinResponse = await controller.createAndJoin(
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

			const ret: DeprecatedVideoConferenceJoinResponse = await controller.createAndJoin(
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

			const ret: DeprecatedVideoConferenceInfoResponse = await controller.info(
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

			const ret: DeprecatedVideoConferenceInfoResponse = await controller.end(
				currentUser,
				VideoConferenceScope.COURSE,
				'scopeId'
			);

			expect(ret.state).toEqual(VideoConferenceState.FINISHED);
		});
	});
});
