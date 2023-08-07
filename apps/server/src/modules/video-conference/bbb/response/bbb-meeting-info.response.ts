import { BBBBaseResponse } from './bbb-base.response';

export interface BBBMeetingInfoResponse extends BBBBaseResponse {
	meetingName: string;
	meetingID: string;
	internalMeetingID: string;
	createTime: number;
	createDate: string;
	voiceBridge: number;
	dialNumber: string;
	running: boolean;
	duration: number;
	hasUserJoined: boolean;
	recording: boolean;
	hasBeenForciblyEnded: boolean;
	startTime: number;
	endTime: number;
	participantCount: number;
	listenerCount: number;
	voiceParticipantCount: number;
	videoCount: number;
	maxUsers: number;
	moderatorCount: number;
	attendees: {
		attendee: {
			userID: string;
			fullName: string;
			role: string;
			isPresenter: boolean;
			isListeningOnly: boolean;
			hasJoinedVoice: boolean;
			hasVideo: boolean;
			clientType: string;
		};
	}[];
	metadata: unknown;
	isBreakout: boolean;
	breakoutRooms?: {
		breakout: string;
	}[];
	breakout?: {
		parentMeetingID: string;
		sequence: number;
		freeJoin: boolean;
	};
}
