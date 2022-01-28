import { IsDefined } from 'class-validator';
import { TokenRequestParams } from './token-request-params';

export class TokenRequestPayload {
	@IsDefined()
	token_endpoint!: string;

	@IsDefined()
	tokenRequestParams!: TokenRequestParams;
}
