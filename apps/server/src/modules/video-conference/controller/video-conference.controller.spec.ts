import { Test, TestingModule } from '@nestjs/testing';
import { VideoConferenceController } from '@src/modules/video-conference/controller/video-conference.controller';
import { VideoConferenceUc } from '@src/modules/video-conference/uc/video-conference.uc';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { VideoConferenceScope } from '@shared/domain/interface/vc-scope.enum';
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

describe('VideoConference Controller', () => {
	let module: TestingModule;
	let service: VideoConferenceController;
	let videoConferenceUc: DeepMocked<VideoConferenceUc>;

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

	describe('createAndJoin', () => {
		it('should return a join Response', async () => {
			videoConferenceUc.create.mockReturnValue(Promise.resolve({} as VideoConferenceDTO<BBBCreateResponse>));
			videoConferenceUc.join.mockReturnValue(Promise.resolve({ url: 'mockUrl' } as VideoConferenceJoinDTO));
			const ret: VideoConferenceJoinResponse = await service.createAndJoin(
				{ userId: 'mockId' } as ICurrentUser,
				VideoConferenceScope.COURSE,
				'scopeId',
				{
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: false,
					moderatorMustApproveJoinRequests: true,
				}
			);
			expect(ret.url).toEqual('mockUrl');
		});
	});

	describe('info', () => {
		it('should return an info Response', async () => {
			videoConferenceUc.getMeetingInfo.mockReturnValue(
				Promise.resolve({ state: VideoConferenceState.RUNNING } as VideoConferenceInfoDTO)
			);
			const ret: VideoConferenceInfoResponse = await service.info(
				{ userId: 'mockId' } as ICurrentUser,
				VideoConferenceScope.COURSE,
				'scopeId'
			);
			expect(ret.state).toEqual(VideoConferenceState.RUNNING);
		});
	});

	describe('end', () => {
		it('should return a base Response', async () => {
			videoConferenceUc.end.mockReturnValue(
				Promise.resolve({ state: VideoConferenceState.FINISHED } as VideoConferenceDTO<BBBBaseResponse>)
			);
			const ret: VideoConferenceInfoResponse = await service.end(
				{ userId: 'mockId' } as ICurrentUser,
				VideoConferenceScope.COURSE,
				'scopeId'
			);
			expect(ret.state).toEqual(VideoConferenceState.FINISHED);
		});
	});
});
