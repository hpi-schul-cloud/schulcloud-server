import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { RegistrationPinEntity } from '../entity';
import { RegistrationPinRepo } from '../repo';

@Injectable()
export class RegistrationPinService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo, private readonly logger: Logger) {
		this.logger.setContext(RegistrationPinService.name);
	}

	public async findByEmail(email: string): Promise<RegistrationPinEntity[]> {
		const [registrationPins] = await this.registrationPinRepo.findAllByEmail(email);

		return registrationPins;
	}
}
