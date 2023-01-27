import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';

@Injectable()
export class OidcMockProvisioningStrategy extends ProvisioningStrategy {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.OIDC;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });
		if (!idToken || !idToken.preferred_username) {
			throw new OAuthSSOError('Failed to extract preferred_username', 'sso_jwt_problem');
		}

		const externalUser: ExternalUserDto = new ExternalUserDto({
			externalId: idToken.preferred_username as string,
		});

		const oauthData: OauthDataDto = new OauthDataDto({
			system: input.system,
			externalUser,
		});
		return Promise.resolve(oauthData);
	}

	override apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUser.externalId }));
	}
}
