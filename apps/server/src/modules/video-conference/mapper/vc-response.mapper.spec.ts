import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { VideoConferenceResponseDeprecatedMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';
import { VideoConference, VideoConferenceInfo, VideoConferenceJoin, VideoConferenceState } from '../uc/dto';
import { BBBBaseResponse } from '../bbb';
import {
	VideoConferenceBaseResponse,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from '../controller/dto/response/video-conference-deprecated.response';

/**
 * @deprecated Please use the VideoConferenceResponseMapper instead.
 */
describe('VideoConferenceResponseMapper', () => {
	let module: TestingModule;
	let mapper: VideoConferenceResponseDeprecatedMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [VideoConferenceResponseDeprecatedMapper],
		}).compile();
		mapper = module.get(VideoConferenceResponseDeprecatedMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('test mapping', () => {
		it('mapToBaseResponse', () => {
			// Arrange
			const from: VideoConference<BBBBaseResponse> = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
			};

			// Act
			const result: VideoConferenceBaseResponse = mapper.mapToBaseResponse(from);

			// Assert
			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
		});

		it('mapToJoinResponse', () => {
			// Arrange
			const from: VideoConferenceJoin = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
				url: 'url',
			};

			// Act
			const result: VideoConferenceJoinResponse = mapper.mapToJoinResponse(from);

			// Assert
			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.url).toEqual(from.url);
		});

		it('mapToInfoResponse', () => {
			// Arrange
			const from: VideoConferenceInfo = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
				options: {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: false,
				},
			};

			// Act
			const result: VideoConferenceInfoResponse = mapper.mapToInfoResponse(from);

			// Assert
			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.options?.moderatorMustApproveJoinRequests).toEqual(from.options?.moderatorMustApproveJoinRequests);
			expect(result.options?.everyAttendeeJoinsMuted).toEqual(from.options?.everyAttendeeJoinsMuted);
			expect(result.options?.everybodyJoinsAsModerator).toEqual(from.options?.everybodyJoinsAsModerator);
		});
	});
});
