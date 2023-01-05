import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthProvisioningInputDto, ProvisioningDataResponseDto } from '../../dto';

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy<ProvisioningDataResponseDto> {
	override async fetch(input: OauthProvisioningInputDto): Promise<ProvisioningDataResponseDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });
		if (!idToken || !idToken.uuid) {
			throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		}

		return new ProvisioningDataResponseDto({
			externalUserId: idToken.uuid,
		});
	}

	override async apply(data: ProvisioningDataResponseDto): Promise<ProvisioningDto> {
		return Promise.resolve(new ProvisioningDto({ externalUserId: data.externalUserId }));
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}
}
