export interface VideoConferenceOptions {
	everyAttendeeJoinsMuted: boolean;

	everybodyJoinsAsModerator: boolean;

	moderatorMustApproveJoinRequests: boolean;

	logoutUrl?: string;
}

export const defaultVideoConferenceOptions: VideoConferenceOptions = {
	moderatorMustApproveJoinRequests: true,
	everyAttendeeJoinsMuted: false,
	everybodyJoinsAsModerator: false,
};
