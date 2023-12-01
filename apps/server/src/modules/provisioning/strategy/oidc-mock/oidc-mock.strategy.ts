import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IdTokenExtractionFailureLoggableException } from '@src/modules/oauth/loggable';
import { ExternalUserDto, OauthDataDto, OauthDataStrategyInputDto, ProvisioningDto } from '../../dto';
import { ProvisioningStrategy } from '../base.strategy';

@Injectable()
export class OidcMockProvisioningStrategy extends ProvisioningStrategy {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.OIDC;
	}

	override async getData(input: OauthDataStrategyInputDto): Promise<OauthDataDto> {
		const idToken = jwt.decode(input.idToken, { json: true }) as (JwtPayload & { external_sub?: string }) | null;
		if (!idToken || !idToken.external_sub) {
			throw new IdTokenExtractionFailureLoggableException('external_sub');
		}

		const externalUser: ExternalUserDto = new ExternalUserDto({
			externalId: idToken.external_sub,
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
