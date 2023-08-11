import { BBBBaseResponse } from './bbb-base.response';

export interface BBBResponse<T extends BBBBaseResponse> {
	response: T;
}
