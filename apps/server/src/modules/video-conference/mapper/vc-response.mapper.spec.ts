import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain';
import { VideoConferenceState } from '@src/modules/video-conference/controller/dto/vc-state.enum';
import {
	VideoConferenceBaseResponse,
	VideoConferenceInfoResponse,
	VideoConferenceJoinResponse,
} from '@src/modules/video-conference/controller/dto/video-conference.response';
import {
	VideoConferenceDTO,
	VideoConferenceInfoDTO,
	VideoConferenceJoinDTO,
} from '@src/modules/video-conference/dto/video-conference.dto';
import { BBBBaseResponse } from '@src/modules/video-conference/interface/bbb-response.interface';
import { VideoConferenceResponseMapper } from '@src/modules/video-conference/mapper/vc-response.mapper';

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

	describe('test mapping', () => {
		it('mapToBaseResponse', () => {
			// Arrange
			const from: VideoConferenceDTO<BBBBaseResponse> = {
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
			const from: VideoConferenceJoinDTO = {
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
			const from: VideoConferenceInfoDTO = {
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
