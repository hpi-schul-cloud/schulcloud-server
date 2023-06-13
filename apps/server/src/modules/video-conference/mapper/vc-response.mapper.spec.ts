import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import { VideoConferenceBaseResponse } from '../controller/dto';
import { VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';
import { VideoConferenceInfoResponse, VideoConferenceJoinResponse } from '../controller/dto/response';
import { BBBBaseResponse } from '../bbb';

describe('VideoConferenceResponseMapper', () => {
	let module: TestingModule;
	let mapper: VideoConferenceResponseMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [VideoConferenceResponseMapper],
		}).compile();
		mapper = module.get(VideoConferenceResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('mapToBaseResponse', () => {
		it('should map videoConference', () => {
			const from: VideoConference<BBBBaseResponse> = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
			};

			const result: VideoConferenceBaseResponse = mapper.mapToBaseResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
		});
	});

	describe('mapToJoinResponse', () => {
		it('should map videoConferenceJoin', () => {
			const from: VideoConferenceJoin = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
				url: 'url',
			};

			const result: VideoConferenceJoinResponse = mapper.mapToJoinResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.url).toEqual(from.url);
		});
	});

	describe('mapToInfoResponse', () => {
		it('should map videoConferenceInfo', () => {
			const from: VideoConferenceInfo = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
				options: {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: false,
				},
			};

			const result: VideoConferenceInfoResponse = mapper.mapToInfoResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.options?.moderatorMustApproveJoinRequests).toEqual(from.options?.moderatorMustApproveJoinRequests);
			expect(result.options?.everyAttendeeJoinsMuted).toEqual(from.options?.everyAttendeeJoinsMuted);
			expect(result.options?.everybodyJoinsAsModerator).toEqual(from.options?.everybodyJoinsAsModerator);
		});
	});
});
