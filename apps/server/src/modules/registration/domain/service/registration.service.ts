import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { RegistrationRepo } from '../../repo';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';

@Injectable()
export class RegistrationService {
	constructor(private readonly registrationRepo: RegistrationRepo) {}

	public async createRegistration(props: RegistrationCreateProps): Promise<Registration> {
		const registrationProps: RegistrationProps = {
			...props,
			id: new ObjectId().toHexString(),
			registrationHash: this.createRegistrationHash(),
			roomIds: [props.roomId],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const registration = new Registration(registrationProps);

		await this.registrationRepo.save(registration);

		return registration;
	}

	public async saveRegistration(registration: Registration): Promise<void> {
		await this.registrationRepo.save(registration);
	}

	public async getSingleRegistrationByEmail(email: string): Promise<Registration | null> {
		const registrationResult = await this.registrationRepo.findByEmail(email);

		return registrationResult;
	}

	public async getSingleRegistrationByHash(registrationHash: string): Promise<Registration> {
		const registration = await this.registrationRepo.findByHash(registrationHash);

		return registration;
	}

	public async getRegistrationsByRoomId(roomId: string): Promise<Registration[]> {
		const registrations = await this.registrationRepo.findByRoomId(roomId);

		return registrations;
	}

	private createRegistrationHash(): string {
		const registrationHash = crypto.randomBytes(32).toString('base64url');

		return registrationHash;
	}
}
