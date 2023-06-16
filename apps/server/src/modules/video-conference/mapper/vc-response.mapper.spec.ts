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
	describe('test mapping', () => {
		it('mapToBaseResponse', () => {
			const from: VideoConference<BBBBaseResponse> = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
			};

			const result: VideoConferenceBaseResponse = VideoConferenceResponseDeprecatedMapper.mapToBaseResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
		});

		it('mapToJoinResponse', () => {
			const from: VideoConferenceJoin = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
				url: 'url',
			};

			const result: VideoConferenceJoinResponse = VideoConferenceResponseDeprecatedMapper.mapToJoinResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.url).toEqual(from.url);
		});

		it('mapToInfoResponse', () => {
			const from: VideoConferenceInfo = {
				state: VideoConferenceState.RUNNING,
				permission: Permission.ADD_SCHOOL_MEMBERS,
				options: {
					everyAttendeeJoinsMuted: true,
					everybodyJoinsAsModerator: true,
					moderatorMustApproveJoinRequests: false,
				},
			};

			const result: VideoConferenceInfoResponse = VideoConferenceResponseDeprecatedMapper.mapToInfoResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.options?.moderatorMustApproveJoinRequests).toEqual(from.options?.moderatorMustApproveJoinRequests);
			expect(result.options?.everyAttendeeJoinsMuted).toEqual(from.options?.everyAttendeeJoinsMuted);
			expect(result.options?.everybodyJoinsAsModerator).toEqual(from.options?.everybodyJoinsAsModerator);
		});
	});
});
