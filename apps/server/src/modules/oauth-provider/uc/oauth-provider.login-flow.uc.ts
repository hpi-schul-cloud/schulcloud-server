import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import {
	AcceptLoginRequestBody,
	LoginResponse,
	RedirectResponse,
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

	async getLoginRequest(challenge: string): Promise<LoginResponse> {
		const loginResponse: Promise<LoginResponse> = this.oauthProviderService.getLoginRequest(challenge);
		return loginResponse;
	}

	async patchLoginRequest(
		currentUserId: string,
		challenge: string,
		body: LoginRequestBody | RejectRequestBody,
		query: AcceptQuery
	): Promise<RedirectResponse> {
		const loginResponse: LoginResponse = await this.oauthProviderService.getLoginRequest(challenge);
		let redirectResponse: RedirectResponse;
		if (query.accept && this.isLoginRequestBody(body)) {
			redirectResponse = await this.acceptLoginRequest(currentUserId, loginResponse, body);
		} else {
			redirectResponse = await this.rejectLoginRequest(challenge, body as RejectRequestBody);
		}
		return redirectResponse;
	}

	protected async acceptLoginRequest(
		currentUserId: string,
		loginResponse: LoginResponse,
		loginRequestBody: LoginRequestBody
	): Promise<RedirectResponse> {
		const acceptLoginRequestBody: AcceptLoginRequestBody = await this.oauthProviderLoginFlowService.setSubject(
			currentUserId,
			loginResponse,
			loginRequestBody
		);
		await this.oauthProviderLoginFlowService.validateNextcloudPermission(currentUserId, loginResponse);

		const redirectResponse: RedirectResponse = await this.oauthProviderService.acceptLoginRequest(
			loginResponse.challenge,
			acceptLoginRequestBody
		);
		return redirectResponse;
	}

	protected async rejectLoginRequest(
		challenge: string,
		rejectRequestBody: RejectRequestBody
	): Promise<RedirectResponse> {
		const redirectResponse: Promise<RedirectResponse> = this.oauthProviderService.rejectLoginRequest(
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
