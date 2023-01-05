import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthProvisioningInputDto, ProvisioningDataResponseDto } from '../../dto';

@Injectable()
export class OidcProvisioningStrategy extends ProvisioningStrategy<ProvisioningDataResponseDto> {
	override async fetch(input : OauthProvisioningInputDto): Promise<ProvisioningDataResponseDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });
		if (!idToken || !idToken.preferred_username) {
			throw new OAuthSSOError('Failed to extract preferred_username', 'sso_jwt_problem');
		}

		return new ProvisioningDataResponseDto({
			externalUserId: idToken.preferred_username
		});
	}

	override async apply(data: ProvisioningDataResponseDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUserId }));
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.OIDC;
	}
}
