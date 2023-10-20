export interface VideoConferenceOptions {
	everyAttendeeJoinsMuted: boolean;

	everybodyJoinsAsModerator: boolean;

	moderatorMustApproveJoinRequests: boolean;
}

export const defaultVideoConferenceOptions: VideoConferenceOptions = {
	moderatorMustApproveJoinRequests: true,
	everyAttendeeJoinsMuted: false,
	everybodyJoinsAsModerator: false,
};
