export interface BBBResponse<T extends BBBBaseResponse> {
	response: T;
}

export interface BBBBaseResponse {
	returncode: string;
	messageKey: string;
	message: string;
}

export interface BBBCreateResponse extends BBBBaseResponse {
	meetingID: string;
	internalMeetingID: string;
	parentMeetingID: string;
	createTime: number;
	voiceBridge: number;
	dialNumber: string;
	createDate: string;
	hasUserJoined: boolean;
	duration: number;
	hasBeenForciblyEnded: boolean;
}

export interface BBBJoinResponse extends BBBBaseResponse {
	meeting_id: string;
	user_id: string;
	auth_token: string;
	session_token: string;
	url: string;
}

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
