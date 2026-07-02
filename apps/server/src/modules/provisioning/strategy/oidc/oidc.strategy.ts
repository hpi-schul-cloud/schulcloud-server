import { IdTokenExtractionFailureLoggableException } from '@modules/oauth/loggable';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt from 'jsonwebtoken';
import { ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';

@Injectable()
export class OidcProvisioningStrategy extends ProvisioningStrategy {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.OIDC;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken = jwt.decode(input.idToken, { json: true });
		if (
			!idToken ||
			typeof idToken !== 'object' ||
			!('external_sub' in idToken) ||
			typeof idToken.external_sub !== 'string'
		) {
			throw new IdTokenExtractionFailureLoggableException('external_sub');
		}

		const externalSub = idToken.external_sub;

		const externalUser: ExternalUserDto = new ExternalUserDto({
			externalId: externalSub,
			roles: [],
		});

		const oauthData: OauthDataDto = new OauthDataDto({
			system: input.system,
			externalUser,
		});
		const result = await Promise.resolve(oauthData);

		return result;
	}

	override apply(data: OauthDataDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUser.externalId }));
	}
}
