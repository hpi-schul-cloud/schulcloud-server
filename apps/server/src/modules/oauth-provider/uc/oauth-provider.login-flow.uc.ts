import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import {
	AcceptLoginRequestBody,
	ProviderLoginResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';
import { OauthProviderLoginFlowService } from '@src/modules/oauth-provider/service/oauth-provider.login-flow.service';

@Injectable()
export class OauthProviderLoginFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService
	) {}

	async getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		const loginResponse: Promise<ProviderLoginResponse> = this.oauthProviderService.getLoginRequest(challenge);
		return loginResponse;
	}

	async patchLoginRequest(
		currentUserId: string,
		challenge: string,
		body: LoginRequestBody | RejectRequestBody,
		query: AcceptQuery
	): Promise<ProviderRedirectResponse> {
		const loginResponse: ProviderLoginResponse = await this.oauthProviderService.getLoginRequest(challenge);
		let redirectResponse: ProviderRedirectResponse;
		if (query.accept && this.isLoginRequestBody(body)) {
			redirectResponse = await this.acceptLoginRequest(currentUserId, loginResponse, body);
		} else {
			redirectResponse = await this.rejectLoginRequest(challenge, body as RejectRequestBody);
		}
		return redirectResponse;
	}

	protected async acceptLoginRequest(
		currentUserId: string,
		loginResponse: ProviderLoginResponse,
		loginRequestBody: LoginRequestBody
	): Promise<ProviderRedirectResponse> {
		const acceptLoginRequestBody: AcceptLoginRequestBody = await this.oauthProviderLoginFlowService.setSubject(
			currentUserId,
			loginResponse,
			loginRequestBody
		);
		await this.oauthProviderLoginFlowService.validateNextcloudPermission(currentUserId, loginResponse);

		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderService.acceptLoginRequest(
			loginResponse.challenge,
			acceptLoginRequestBody
		);
		return redirectResponse;
	}

	protected async rejectLoginRequest(
		challenge: string,
		rejectRequestBody: RejectRequestBody
	): Promise<ProviderRedirectResponse> {
		const redirectResponse: Promise<ProviderRedirectResponse> = this.oauthProviderService.rejectLoginRequest(
			challenge,
			rejectRequestBody
		);
		return redirectResponse;
	}

	private isLoginRequestBody(object: unknown): object is LoginRequestBody {
		if ((object as LoginRequestBody).remember) {
			return true;
		}
		return false;
	}
}
