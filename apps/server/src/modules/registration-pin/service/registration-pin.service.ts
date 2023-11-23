import { Injectable } from '@nestjs/common';
import { RegistrationPinRepo } from '../repo/registration-pin.repo';

@Injectable()
export class RegistrationPinService {
	constructor(private readonly registrationPinRepo: RegistrationPinRepo) {}

	async deleteRegistrationPinByEmail(email: string): Promise<number> {
		return this.registrationPinRepo.deleteRegistrationPinByEmail(email);
	}
}
