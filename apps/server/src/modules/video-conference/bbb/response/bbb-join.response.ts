import { BBBBaseResponse } from './bbb-base.response';

export interface BBBJoinResponse extends BBBBaseResponse {
	meeting_id: string;
	user_id: string;
	auth_token: string;
	session_token: string;
	url: string;
}
