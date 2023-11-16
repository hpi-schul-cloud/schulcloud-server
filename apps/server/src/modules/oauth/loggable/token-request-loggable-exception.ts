import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { AxiosError } from 'axios';

export class TokenRequestLoggableException extends AxiosErrorLoggable {
	constructor(error: AxiosError) {
		super(error, 'OAUTH_TOKEN_REQUEST_ERROR');
	}
}
