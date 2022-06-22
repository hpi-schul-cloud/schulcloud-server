import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.interface.strategy';
import { ProvisioningDto } from '@src/modules/provisioning/service/dto/provisioning.dto';
import { IProviderResponse } from '@src/modules/provisioning/strategy/provider.response';
import { IservOAuthService } from '@src/modules/oauth/service/iserv-oauth.service';

export class IservProvisioningStrategy extends ProvisioningStrategy {
	constructor(readonly iservOauthService: IservOAuthService) {
		super();
	}

	mapToDto(response: IProviderResponse, target: ProvisioningDto): ProvisioningDto {
		return {};
	}

	strategySpecific(): void {
		// todo iserv findByUser etc
	}
}
