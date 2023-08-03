import { BBBBaseResponse } from './bbb-base.response';

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
