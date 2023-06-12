import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalToolDO, Permission, PseudonymDO, User } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import {
	AcceptLoginRequestBody,
	ProviderLoginResponse,
	ProviderRedirectResponse,
} from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, LoginRequestBody, OAuthRejectableBody } from '@src/modules/oauth-provider/controller/dto';
import { OauthProviderRequestMapper } from '@src/modules/oauth-provider/mapper/oauth-provider-request.mapper';
import { PseudonymService } from '@src/modules/pseudonym/service';
import { AuthorizationService } from '../../authorization';
import { OauthProviderLoginFlowService } from '../service/oauth-provider-login-flow.service';

@Injectable()
export class OauthProviderLoginFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService,
		private readonly oauthProviderRequestMapper: OauthProviderRequestMapper,
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService
	) {}

	async getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		const loginResponse: Promise<ProviderLoginResponse> = this.oauthProviderService.getLoginRequest(challenge);
		return loginResponse;
	}

	async patchLoginRequest(
		currentUserId: string,
		challenge: string,
		body: LoginRequestBody,
		query: AcceptQuery
	): Promise<ProviderRedirectResponse> {
		let redirectResponse: ProviderRedirectResponse;
		if (query.accept) {
			redirectResponse = await this.acceptLoginRequest(currentUserId, challenge, body);
		} else {
			redirectResponse = await this.rejectLoginRequest(challenge, body);
		}
		return redirectResponse;
	}

	private async acceptLoginRequest(
		currentUserId: string,
		challenge: string,
		loginRequestBody: LoginRequestBody
	): Promise<ProviderRedirectResponse> {
		const loginResponse: ProviderLoginResponse = await this.oauthProviderService.getLoginRequest(challenge);

		if (!loginResponse.client.client_id) {
			throw new InternalServerErrorException(`Cannot find oAuthClientId in login response for challenge: ${challenge}`);
		}

		const tool: ExternalToolDO | LtiToolDO = await this.oauthProviderLoginFlowService.findToolByClientId(
			loginResponse.client.client_id
		);

		if (!tool.id) {
			throw new InternalServerErrorException('Tool has no id');
		}

		if (this.oauthProviderLoginFlowService.isNextcloudTool(tool)) {
			const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
			this.authorizationService.checkAllPermissions(user, [Permission.NEXTCLOUD_USER]);
		}

		let pseudonym: PseudonymDO | null = await this.pseudonymService.findByUserIdAndToolId(currentUserId, tool.id);

		if (!pseudonym) {
			pseudonym = await this.pseudonymService.createPseudonym(currentUserId, tool.id);
		}

		const acceptLoginRequestBody: AcceptLoginRequestBody =
			this.oauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
				loginRequestBody,
				currentUserId,
				pseudonym.pseudonym
			);

		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderService.acceptLoginRequest(
			loginResponse.challenge,
			acceptLoginRequestBody
		);

		return redirectResponse;
	}

	private async rejectLoginRequest(
		challenge: string,
		rejectRequestBody: OAuthRejectableBody
	): Promise<ProviderRedirectResponse> {
		const redirectResponse: Promise<ProviderRedirectResponse> = this.oauthProviderService.rejectLoginRequest(
			challenge,
			rejectRequestBody
		);
		return redirectResponse;
	}
}
