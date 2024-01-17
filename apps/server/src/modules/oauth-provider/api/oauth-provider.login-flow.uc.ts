import { AuthorizationService } from '@modules/authorization';
import { PseudonymService } from '@modules/pseudonym/service';
import { ExternalTool, Oauth2ToolConfig } from '@modules/tool/external-tool/domain';
import { UserService } from '@modules/user';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Pseudonym, UserDO } from '@shared/domain/domainobject';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AcceptLoginRequestBody, ProviderLoginResponse, ProviderRedirectResponse } from '../domain';
import { OauthProviderLoginFlowService } from '../domain/service/oauth-provider.login-flow.service';
import { OauthProviderService } from '../domain/service/oauth-provider.service';
import { AcceptQuery, LoginRequestBody, OAuthRejectableBody } from './dto';
import { OauthProviderRequestMapper } from './mapper';

@Injectable()
export class OauthProviderLoginFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService,
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService,
		private readonly userService: UserService
	) {}

	public async getLoginRequest(challenge: string): Promise<ProviderLoginResponse> {
		const loginResponse: ProviderLoginResponse = await this.oauthProviderService.getLoginRequest(challenge);

		return loginResponse;
	}

	public async patchLoginRequest(
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

		const tool: ExternalTool | LtiToolDO = await this.oauthProviderLoginFlowService.findToolByClientId(
			loginResponse.client.client_id
		);

		if (!tool.id) {
			throw new InternalServerErrorException('Tool has no id');
		}

		if (this.oauthProviderLoginFlowService.isNextcloudTool(tool)) {
			const user: User = await this.authorizationService.getUserWithPermissions(currentUserId);
			this.authorizationService.checkAllPermissions(user, [Permission.NEXTCLOUD_USER]);
		}

		const user: UserDO = await this.userService.findById(currentUserId);
		const pseudonym: Pseudonym = await this.pseudonymService.findOrCreatePseudonym(user, tool);

		const skipConsent: boolean = this.shouldSkipConsent(tool);

		const acceptLoginRequestBody: AcceptLoginRequestBody = OauthProviderRequestMapper.mapCreateAcceptLoginRequestBody(
			loginRequestBody,
			currentUserId,
			pseudonym.pseudonym,
			{
				skipConsent,
			}
		);

		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderService.acceptLoginRequest(
			loginResponse.challenge,
			acceptLoginRequestBody
		);

		return redirectResponse;
	}

	private shouldSkipConsent(tool: ExternalTool | LtiToolDO): boolean {
		if (tool instanceof LtiToolDO) {
			return !!tool.skipConsent;
		}
		if (tool.config instanceof Oauth2ToolConfig) {
			return tool.config.skipConsent;
		}
		throw new UnprocessableEntityException(
			`Cannot use Tool ${tool.name} for OAuth2 login, since it is not a LtiTool or OAuth2-ExternalTool`
		);
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
