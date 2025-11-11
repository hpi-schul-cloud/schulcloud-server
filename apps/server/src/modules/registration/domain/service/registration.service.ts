import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Registration, RegistrationCreateProps, RegistrationProps, RegistrationUpdateProps } from '../do';
import { RegistrationRepo } from '@modules/registration/repo';
import bcrypt from 'bcryptjs';

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

	public async updateRegistration(registration: Registration, props: RegistrationUpdateProps): Promise<Registration> {
		const encryptedUpdatedPassword = await this.encryptPassword(props.password);

		registration.password = encryptedUpdatedPassword;
		registration.consent = props.consent;
		// separate the update of the pin into separate method as its done by resending the pin?
		registration.pin = props.pin;
		registration.language = props.language;
		registration.roomIds = props.roomIds;

		await this.registrationRepo.save(registration);

		return registration;
	}

	public async getSingleRegistrationByRegistrationId(registrationId: string): Promise<Registration> {
		const registration = await this.registrationRepo.findById(registrationId);

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

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}
}
