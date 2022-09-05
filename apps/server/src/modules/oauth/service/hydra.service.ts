import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OauthConfig } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LtiToolRepo } from '@shared/repo';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class HydraSsoService {
	constructor(private readonly ltiRepo: LtiToolRepo) {}

	async generateConfig(ltiToolId: string): Promise<OauthConfig> {
		const tool: LtiToolDO = await this.ltiRepo.findById(ltiToolId);

		if (!tool.oAuthClientId || !tool.secret) {
			throw new NotFoundException(ltiToolId, 'Suitable tool not found!');
		}

		const hydraOauthConfig = new OauthConfig({
			authEndpoint: '',
			clientId: tool.oAuthClientId,
			clientSecret: tool.secret,
			grantType: 'authorization_code',
			issuer: `${Configuration.get('HYDRA_URI') as string}/`,
			jwksEndpoint: `${Configuration.get('HYDRA_URI') as string}/.well-known/jwks.json`,
			logoutEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/sessions/logout`,
			provider: 'hydra',
			redirectUri: `${Configuration.get('API_HOST') as string}/v3/sso/hydra`,
			responseType: 'id_token',
			scope: '',
			tokenEndpoint: `${Configuration.get('HYDRA_URI') as string}/oauth2/token`,
		});

		return hydraOauthConfig;
	}
}
