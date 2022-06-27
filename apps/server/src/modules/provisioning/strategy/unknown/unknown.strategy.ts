import { ProvisioningStrategy } from '@src/modules/provisioning/strategy/base.strategy';
import { Logger } from '@src/core/logger';
import { UnknownResponseMapper } from '@src/modules/provisioning/strategy/unknown/unknown-response.mapper';
import { UnknownResponse } from '@src/modules/provisioning/strategy/unknown/unknown.response';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UnknownProvisioningStrategy extends ProvisioningStrategy<UnknownResponse> {
	constructor(private readonly logger: Logger, private readonly unknownResponseMapper: UnknownResponseMapper) {
		super(unknownResponseMapper);
		this.logger.setContext(UnknownProvisioningStrategy.name);
	}

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
