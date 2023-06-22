import { BBBStatus } from './bbb-status.enum';

export interface BBBBaseResponse {
	returncode: BBBStatus;
	messageKey: string;
	message: string;
}
