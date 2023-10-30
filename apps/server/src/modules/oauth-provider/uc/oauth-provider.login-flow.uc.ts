import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { Pseudonym } from '@shared/domain/domainobject/pseudonym.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { AcceptLoginRequestBody } from '@shared/infra/oauth-provider/dto/request/accept-login-request.body';
import { ProviderLoginResponse } from '@shared/infra/oauth-provider/dto/response/login.response';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto/response/redirect.response';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { PseudonymService } from '@src/modules/pseudonym/service/pseudonym.service';
import { Oauth2ToolConfig } from '@src/modules/tool/external-tool/domain/config/oauth2-tool-config.do';
import { ExternalTool } from '@src/modules/tool/external-tool/domain/external-tool.do';
import { UserService } from '@src/modules/user/service/user.service';
import { AcceptQuery } from '../controller/dto/request/accept.query';
import { LoginRequestBody } from '../controller/dto/request/login-request.body';
import { OAuthRejectableBody } from '../controller/dto/request/oauth-rejectable.body';
import { OauthProviderRequestMapper } from '../mapper/oauth-provider-request.mapper';
import { OauthProviderLoginFlowService } from '../service/oauth-provider.login-flow.service';

@Injectable()
export class OauthProviderLoginFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService,
		private readonly pseudonymService: PseudonymService,
		private readonly authorizationService: AuthorizationService,
		private readonly userService: UserService
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
