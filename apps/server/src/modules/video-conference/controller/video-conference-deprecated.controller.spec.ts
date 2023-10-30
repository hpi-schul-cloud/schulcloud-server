import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceScope } from '@shared/domain/interface/video-conference-scope.enum';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { BBBBaseResponse } from '../bbb/response/bbb-base.response';
import { BBBCreateResponse } from '../bbb/response/bbb-create.response';
import { defaultVideoConferenceOptions } from '../interface/video-conference-options.interface';
import { VideoConference } from '../uc/dto/video-conference';
import { VideoConferenceInfo } from '../uc/dto/video-conference-info';
import { VideoConferenceJoin } from '../uc/dto/video-conference-join';
import { VideoConferenceState } from '../uc/dto/video-conference-state.enum';
import { VideoConferenceDeprecatedUc } from '../uc/video-conference-deprecated.uc';
import {
	DeprecatedVideoConferenceInfoResponse,
	DeprecatedVideoConferenceJoinResponse,
} from './dto/response/video-conference-deprecated.response';
import { VideoConferenceDeprecatedController } from './video-conference-deprecated.controller';

describe('VideoConferenceDeprecatedController', () => {
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
