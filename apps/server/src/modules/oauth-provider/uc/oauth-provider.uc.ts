import { LoginResponse, RedirectResponse, RejectRequestBody } from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { Injectable } from '@nestjs/common';
import { OauthProviderLoginFlowUc } from '@src/modules/oauth-provider/uc/oauth-login-flow.uc';

@Injectable()
export class OauthProviderUc {
	constructor(private readonly oauthLoginFlowUc: OauthProviderLoginFlowUc) {}

	async getLoginRequest(challenge: string): Promise<LoginResponse> {
		const loginResponse: Promise<LoginResponse> = this.oauthLoginFlowUc.getLoginRequest(challenge);
		return loginResponse;
	}

	async patchLoginRequest(
		currentUserId: string,
		challenge: string,
		loginRequestBody: LoginRequestBody,
		query: AcceptQuery
	): Promise<RedirectResponse> {
		const redirectResponse: Promise<RedirectResponse> = this.oauthLoginFlowUc.patchLoginRequest(
			currentUserId,
			challenge,
			loginRequestBody,
			query
		);
		return redirectResponse;
	}
}
