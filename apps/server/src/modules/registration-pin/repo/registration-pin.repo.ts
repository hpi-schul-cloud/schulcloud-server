import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { RegistrationPinEntity } from '../entity';

@Injectable()
export class RegistrationPinRepo {
	constructor(private readonly em: EntityManager) {}

	async deleteRegistrationPinByEmail(email: string): Promise<EntityId | null> {
		const registrationPin = await this.em.findOne(RegistrationPinEntity, { email });
		if (registrationPin === null) {
			return null;
		}

		await this.em.removeAndFlush(registrationPin);

		return registrationPin.id;
	}
}
