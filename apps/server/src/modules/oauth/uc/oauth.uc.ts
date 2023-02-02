import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { ISession } from '@shared/domain/types/session';
import { Logger } from '@src/core/logger';
import { ProvisioningDto, ProvisioningService } from '@src/modules/provisioning';
import { OauthDataDto } from '@src/modules/provisioning/dto/oauth-data.dto';
import { SystemService } from '@src/modules/system';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { UserService } from '@src/modules/user';
import { UserMigrationService } from '@src/modules/user-migration';
import { OauthTokenResponse } from '../controller/dto';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { SSOErrorCode } from '../error/sso-error-code.enum';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OAuthService } from '../service/oauth.service';
import { OauthLoginStateDto } from './dto/oauth-login-state.dto';

@Injectable()
export class OauthUc {
	constructor(
		private readonly oauthService: OAuthService,
		private readonly systemService: SystemService,
		private readonly provisioningService: ProvisioningService,
		private readonly userService: UserService,
		private readonly userMigrationService: UserMigrationService,
		private readonly logger: Logger
	) {
		this.logger.setContext(OauthUc.name);
	}

	async startOauthLogin(session: ISession, systemId: EntityId, postLoginRedirect?: string): Promise<string> {
		const state = 'abc'; // TODO CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		if (!system.oauthConfig) {
			throw new BadRequestException(`Requested system ${systemId} has no oauth configured`);
		}

		const authenticationUrl: string = this.oauthService.getAuthenticationUrl(system.oauthConfig, state);

		session.oauthLoginState = new OauthLoginStateDto({
			state,
			systemId,
			postLoginRedirect,
			errorRedirect: system.oauthConfig?.provider === 'iserv' ? system.oauthConfig.logoutEndpoint : undefined, // TODO post logout redirect
		});

		return authenticationUrl;
	}

	async processOAuthLogin(cachedState: OauthLoginStateDto, code?: string, error?: string): Promise<OAuthProcessDto> {
		if (!code) {
			throw new OAuthSSOError('Authorization in external system failed', error || SSOErrorCode.SSO_AUTH_CODE_STEP);
		}

		const { state, systemId, postLoginRedirect } = cachedState;

		this.logger.debug(`Oauth login process started. [state: ${state}, system: ${systemId}]`);

		const system: SystemDto = await this.systemService.findOAuthById(systemId);
		if (!system.oauthConfig) {
			throw new OAuthSSOError(`Requested system ${systemId} has no oauth configured`, SSOErrorCode.SSO_INTERNAL_ERROR);
		}
		const { oauthConfig } = system;

		this.logger.debug(`Requesting token from external system. [state: ${state}, system: ${systemId}]`);
		const queryToken: OauthTokenResponse = await this.oauthService.requestToken(code, oauthConfig);

		await this.oauthService.validateToken(queryToken.id_token, oauthConfig);

		this.logger.debug(`Fetching user data. [state: ${state}, system: ${systemId}]`);
		const data: OauthDataDto = await this.provisioningService.getData(
			queryToken.access_token,
			queryToken.id_token,
			systemId
		);

		if (data.externalSchool?.officialSchoolNumber) {
			const shouldMigrate: boolean = await this.shouldUserMigrate(
				data.externalUser.externalId,
				data.externalSchool.officialSchoolNumber,
				systemId
			);
			if (shouldMigrate) {
				this.logger.debug(
					`School is in Migration. Redirecting user to migration page. [state: ${state}, system: ${systemId}]`
				);
				const redirect: string = await this.userMigrationService.getMigrationRedirect(
					data.externalSchool.officialSchoolNumber,
					systemId
				);
				const response: OAuthProcessDto = new OAuthProcessDto({
					redirect,
				});
				return response;
			}
		}

		this.logger.debug(`Starting provisioning of user. [state: ${state}, system: ${systemId}]`);
		const provisioningDto: ProvisioningDto = await this.provisioningService.provisionData(data);

		const user: UserDO = await this.oauthService.findUser(
			queryToken.id_token,
			provisioningDto.externalUserId,
			systemId
		);

		this.logger.debug(`Generating jwt for user. [state: ${state}, system: ${systemId}]`);
		const jwtResponse: string = await this.oauthService.getJwtForUser(user.id as string);

		const redirect: string = this.oauthService.getRedirectUrl(
			oauthConfig.provider,
			queryToken.id_token,
			oauthConfig.logoutEndpoint,
			postLoginRedirect
		);

		const response: OAuthProcessDto = new OAuthProcessDto({
			jwt: jwtResponse,
			redirect,
		});
		return response;
	}

	private async shouldUserMigrate(externalUserId: string, officialSchoolNumber: string, systemId: EntityId) {
		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);
		const isSchoolInMigration: boolean = await this.userMigrationService.isSchoolInMigration(officialSchoolNumber);

		const shouldMigrate = !existingUser && isSchoolInMigration;
		return shouldMigrate;
	}
}
