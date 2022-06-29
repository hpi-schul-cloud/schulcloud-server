import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { UnknownResponse } from '@src/modules/provisioning/strategy/unknown/unknown.response';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UnknownProvisioningStrategy extends ProvisioningStrategy<UnknownResponse> {
	override getProvisioningData(): Promise<UnknownResponse> {
		return Promise.resolve(
			new UnknownResponse({
				email: 'unknownMail@mail.de',
				firstName: 'unknownFirstname',
				lastName: 'unknownLastname',
				schoolName: 'unknownSchoolname',
				userRoles: [],
			})
		);
	}
}
