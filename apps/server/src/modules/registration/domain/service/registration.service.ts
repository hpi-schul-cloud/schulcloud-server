import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';
import { RegistrationRepo } from '@modules/registration/repo';

@Injectable()
export class RegistrationService {
	constructor(private readonly registrationRepo: RegistrationRepo) {}

	public async createRegistration(props: RegistrationCreateProps): Promise<Registration> {
		const registrationProps: RegistrationProps = {
			id: new ObjectId().toHexString(),
			email: props.email,
			firstName: props.firstName,
			lastName: props.lastName,
			password: '',
			consent: props.consent,
			pin: '',
			language: props.language,
			roomIds: props.roomIds,
			registrationHash: 'someRandomHashForNow', // we will create a proper hash here later
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const registration = new Registration(registrationProps);

		await this.registrationRepo.save(registration);

		return registration;
	}

	public async getSingleRegistrationByHash(registrationHash: string): Promise<Registration> {
		const registration = await this.registrationRepo.findByHash(registrationHash);

		return registration;
	}

	public async getRegistrationsByRoomId(roomId: string): Promise<Registration[]> {
		const registrations = this.registrationRepo.findByRoomId(roomId);

		return registrations;
	}
}
