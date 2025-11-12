import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Registration, RegistrationCreateProps, RegistrationProps, RegistrationUpdateProps } from '../do';
import { RegistrationRepo } from '../../repo';
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
			// we will create a proper hash here later
			registrationHash: 'someRandomHashForNow',
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

	public async saveRegistration(registration: Registration): Promise<void> {
		await this.registrationRepo.save(registration);
	}

	public async getSingleRegistrationByRegistrationId(registrationId: string): Promise<Registration> {
		const registration = await this.registrationRepo.findById(registrationId);

		return registration;
	}

	public async getSingleRegistrationByEmail(email: string): Promise<Registration> {
		const registration = await this.registrationRepo.findByEmail(email);

		return registration;
	}

	public async getSingleRegistrationByHash(registrationHash: string): Promise<Registration> {
		const registration = await this.registrationRepo.findByHash(registrationHash);

		return registration;
	}

	public async getRegistrationsByRoomId(roomId: string): Promise<Registration[]> {
		const registrations = await this.registrationRepo.findByRoomId(roomId);

		return registrations;
	}

	private async encryptPassword(password: string): Promise<string> {
		const encryptedPassword = await bcrypt.hash(password, 10);
		return encryptedPassword;
	}
}
