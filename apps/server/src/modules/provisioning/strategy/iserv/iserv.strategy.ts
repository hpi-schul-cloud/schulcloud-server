import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import jwtDecode from 'jwt-decode';
import { ProvisioningDto } from '@src/modules/provisioning/dto/provisioning.dto';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';

export type IservStrategyData = {
	idToken: string;
};

interface IIservJwt {
	uuid: string;
}

@Injectable()
export class IservProvisioningStrategy extends ProvisioningStrategy<IservStrategyData> {
	override apply(params: IservStrategyData): Promise<ProvisioningDto> {
		const idToken: IIservJwt = jwtDecode(params.idToken);
		if (!idToken || !idToken.uuid) {
			throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		}
		return Promise.resolve(new ProvisioningDto({ externalUserId: idToken.uuid }));
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.ISERV;
	}
}
