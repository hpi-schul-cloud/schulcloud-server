import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { OauthDataAdapterInputDto, ProvisioningDto } from '../../dto';
import { OauthDataDto } from '../../dto/oauth-data.dto';
import { ExternalUserDto } from '../../dto/external-user.dto';

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy {
	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}

	override fetch(input: OauthDataAdapterInputDto): Promise<OauthDataDto> {
		const idToken: JwtPayload | null = jwt.decode(input.idToken, { json: true });
		if (!idToken || !idToken.uuid) {
			throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
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
