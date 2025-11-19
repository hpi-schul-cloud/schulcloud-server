import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException, Injectable } from '@nestjs/common';
import { isDisposableEmail as _isDisposableEmail } from 'disposable-email-domains-js';
import crypto from 'node:crypto';
import { RegistrationRepo } from '../../repo';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';

// only placeholder until we decided to use it at all as no typing is provided by the package but is better maintained then the alternative
// we should actually replace disposable-email-domains with the new one as the first is not maintained anymore
const isDisposableEmail = _isDisposableEmail as (email: string) => boolean;
@Injectable()
export class RegistrationService {
	constructor(private readonly registrationRepo: RegistrationRepo) {}

	public async createRegistration(props: RegistrationCreateProps): Promise<Registration> {
		this.blockForbiddenDomains(props.email);

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

	private blockForbiddenDomains(email: string): void {
		const isBlockedDomain = isDisposableEmail(email);
		if (isBlockedDomain) {
			throw new BadRequestException('Registration using disposable email domains is not allowed.');
		}
	}

	private generateRegistrationLink(hash: string): string {
		const BASE_REGISTRATION_URL = `${window.location.origin}/registration-external-members/`;
		const registrationLink = `${BASE_REGISTRATION_URL}?registrationHash=${hash}`;

		return registrationLink;
	}
}
