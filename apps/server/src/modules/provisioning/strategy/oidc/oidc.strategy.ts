import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';

export type OidcStrategyData = {
	idToken: string;
};

@Injectable()
export class OidcProvisioningStrategy extends ProvisioningStrategy<OidcStrategyData> {
	override async apply(params: OidcStrategyData): Promise<ProvisioningDto> {
		const idToken: JwtPayload | null = jwt.decode(params.idToken, { json: true });
		if (!idToken || !idToken.preferred_username) {
			throw new OAuthSSOError('Failed to extract preferred_username', 'sso_jwt_problem');
		}
		return Promise.resolve(new ProvisioningDto({ externalUserId: idToken.preferred_username as string }));
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.OIDC;
	}
}
