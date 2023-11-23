import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { RegistrationPinEntity } from '../entity/registration-pin.entity';

@Injectable()
export class RegistrationPinRepo {
	constructor(private readonly em: EntityManager) {}

	async deleteRegistrationPinByEmail(email: string): Promise<number> {
		const promise: Promise<number> = this.em.nativeDelete(RegistrationPinEntity, { email });

		return promise;
	}
}
