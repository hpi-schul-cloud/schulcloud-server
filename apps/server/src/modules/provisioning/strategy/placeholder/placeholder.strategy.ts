import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PlaceholderResponse } from '@src/modules/provisioning/strategy/placeholder/placeholder.response';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

@Injectable()
export class PlaceholderProvisioningStrategy extends ProvisioningStrategy<PlaceholderResponse> {
	override getProvisioningData(): Promise<PlaceholderResponse> {
		throw new NotImplementedException();
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.PLACEHOLDER;
	}
}
