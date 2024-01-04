import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { RegistrationPinRepo } from '../repo';

@Injectable()
export class RegistrationPinService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo, private readonly logger: LegacyLogger) {
		this.logger.setContext(RegistrationPinService.name);
	}

	async deleteRegistrationPinByEmail(email: string): Promise<number> {
		this.logger.log(`Deleting registrationPin for email ${email}`);
		const result = await this.registrationPinRepo.deleteRegistrationPinByEmail(email);
		this.logger.log(`Successfully deleted ${result} registrationPin for email ${email}`);

		return result;
	}
}
