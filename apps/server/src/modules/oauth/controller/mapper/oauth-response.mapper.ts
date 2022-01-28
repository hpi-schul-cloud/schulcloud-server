import { Response } from 'express';
import { OAuthResponse } from '../dto/oauth.response';

export class OAuthResponseMapper {
	static mapToResponse(oauthResponse: OAuthResponse, response: Response): Response {
		if (oauthResponse.jwt) response.cookie('jwt', oauthResponse.jwt);
		if (oauthResponse.error) response.cookie('error', oauthResponse.error);
		return response;
	}
}
