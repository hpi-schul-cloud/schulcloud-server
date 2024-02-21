import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted } from '@shared/domain/types';
import { RegistrationPinEntity } from '../entity';

@Injectable()
export class RegistrationPinRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByEmail(email: string): Promise<Counted<RegistrationPinEntity[]>> {
		const [registrationPins, count] = await this.em.findAndCount(RegistrationPinEntity, {
			email,
		});

		return [registrationPins, count];
	}

	async deleteRegistrationPinByEmail(email: string): Promise<number> {
		const deletedRegistrationPinNumber = await this.em.nativeDelete(RegistrationPinEntity, { email });

		return deletedRegistrationPinNumber;
	}
}
