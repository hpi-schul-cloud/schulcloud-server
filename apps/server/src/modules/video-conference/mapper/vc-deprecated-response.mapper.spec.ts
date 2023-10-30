import { Permission } from '@shared/domain/interface/permission.enum';
import { BBBBaseResponse } from '../bbb/response/bbb-base.response';
import {
	DeprecatedVideoConferenceInfoResponse,
	DeprecatedVideoConferenceJoinResponse,
	VideoConferenceBaseResponse,
} from '../controller/dto/response/video-conference-deprecated.response';
import { VideoConference } from '../uc/dto/video-conference';
import { VideoConferenceInfo } from '../uc/dto/video-conference-info';
import { VideoConferenceJoin } from '../uc/dto/video-conference-join';
import { VideoConferenceState } from '../uc/dto/video-conference-state.enum';
import { VideoConferenceResponseDeprecatedMapper } from './vc-deprecated-response.mapper';

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

			const result: DeprecatedVideoConferenceJoinResponse =
				VideoConferenceResponseDeprecatedMapper.mapToJoinResponse(from);

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

			const result: DeprecatedVideoConferenceInfoResponse =
				VideoConferenceResponseDeprecatedMapper.mapToInfoResponse(from);

			expect(result.state).toEqual(from.state);
			expect(result.permission).toEqual(from.permission);
			expect(result.options?.moderatorMustApproveJoinRequests).toEqual(from.options?.moderatorMustApproveJoinRequests);
			expect(result.options?.everyAttendeeJoinsMuted).toEqual(from.options?.everyAttendeeJoinsMuted);
			expect(result.options?.everybodyJoinsAsModerator).toEqual(from.options?.everybodyJoinsAsModerator);
		});
	});
});
