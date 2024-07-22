import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { AxiosError } from 'axios';

export class HydraOauthFailedLoggableException extends AxiosErrorLoggable {
	constructor(error: AxiosError) {
		super(error, 'HYDRA_OAUTH_FAILED');
	}
}
