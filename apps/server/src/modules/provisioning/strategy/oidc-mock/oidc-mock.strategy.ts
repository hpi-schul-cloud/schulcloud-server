import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthDataAdapterInputDto, ProvisioningDto } from '../../dto';
import { ExternalUserDto } from '../../dto/external-user.dto';
import { OauthDataDto } from '../../dto/oauth-data.dto';

@Injectable()
export class OidcMockProvisioningStrategy extends ProvisioningStrategy {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.OIDC;
	}

	override async fetch(input: OauthDataAdapterInputDto): Promise<OauthDataDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });
		if (!idToken || !idToken.preferred_username) {
			throw new OAuthSSOError('Failed to extract preferred_username', 'sso_jwt_problem');
		}

		const externalUser: ExternalUserDto = new ExternalUserDto({
			externalId: idToken.preferred_username as string,
		});

		const oauthData: OauthDataDto = new OauthDataDto({
			systemId: input.system.systemId,
			externalUser,
		});
		return Promise.resolve(oauthData);
	}

	override apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUser.externalId }));
	}
}
