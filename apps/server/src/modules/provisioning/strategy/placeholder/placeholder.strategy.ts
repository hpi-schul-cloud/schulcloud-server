import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Injectable } from '@nestjs/common';
import { PlaceholderResponse } from '@src/modules/provisioning/strategy/placeholder/placeholder.response';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';

@Injectable()
export class PlaceholderProvisioningStrategy extends ProvisioningStrategy<PlaceholderResponse> {
	override getProvisioningData(): Promise<PlaceholderResponse> {
		return Promise.resolve(
			new PlaceholderResponse({
				email: 'unknownMail@mail.de',
				firstName: 'unknownFirstname',
				lastName: 'unknownLastname',
				schoolName: 'unknownSchoolname',
				userRoles: [],
			})
		);
	}

	getType(): SystemProvisioningStrategy {
		return SystemProvisioningStrategy.PLACEHOLDER;
	}
}
