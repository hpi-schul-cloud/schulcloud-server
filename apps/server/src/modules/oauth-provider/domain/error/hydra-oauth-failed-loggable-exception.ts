import { AxiosError } from 'axios';
import { AxiosErrorLoggable } from '../../../../core/error/loggable';

export class HydraOauthFailedLoggableException extends AxiosErrorLoggable {
	constructor(error: AxiosError) {
		super(error, 'HYDRA_OAUTH_FAILED');
	}
}
