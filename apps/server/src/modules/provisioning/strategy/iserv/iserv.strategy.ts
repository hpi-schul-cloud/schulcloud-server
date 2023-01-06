import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}

	override getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });
		if (!idToken || !idToken.uuid) {
			return Promise.reject(new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem'));
		}

		const externalUser: ExternalUserDto = new ExternalUserDto({
			externalId: idToken.uuid as string,
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
