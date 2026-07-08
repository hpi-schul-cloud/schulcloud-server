import { AxiosErrorLoggable } from '@infra/error';
import { AxiosError } from 'axios';

export class HydraOauthFailedLoggableException extends AxiosErrorLoggable {
	constructor(error: AxiosError) {
		super(error, 'HYDRA_OAUTH_FAILED');
	}
}
