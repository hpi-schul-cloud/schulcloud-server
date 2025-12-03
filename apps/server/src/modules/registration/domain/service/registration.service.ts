import { MailService } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UUID } from 'bson';
import { isDisposableEmail as _isDisposableEmail } from 'disposable-email-domains-js';
import { RegistrationRepo } from '../../repo';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';

@Injectable()
export class RegistrationService {
	constructor(private readonly registrationRepo: RegistrationRepo, private readonly mailService: MailService) {}

	public async createOrUpdateRegistration(props: RegistrationCreateProps): Promise<Registration> {
		const existingRegistration = await this.getSingleRegistrationByEmail(props.email);

		const registration = existingRegistration
			? await this.updateRegistration(existingRegistration, props)
			: await this.createRegistraton({ ...props });

		return registration;
	}

	public async saveRegistration(registration: Registration): Promise<void> {
		await this.registrationRepo.save(registration);
	}

	public async getSingleRegistrationByEmail(email: string): Promise<Registration | null> {
		const registrationResult = await this.registrationRepo.findByEmail(email);

		return registrationResult;
	}

	public async getSingleRegistrationBySecret(registrationSecret: string): Promise<Registration> {
		const registration = await this.registrationRepo.findBySecret(registrationSecret);

		return registration;
	}

	public async getRegistrationsByRoomId(roomId: string): Promise<Registration[]> {
		const registrations = await this.registrationRepo.findByRoomId(roomId);

		return registrations;
	}

	public async sendRegistrationMail(registration: Registration): Promise<void> {
		const registrationMail = registration.generateRegistrationMail();
		await this.mailService.send(registrationMail);
	}

	private createRegistrationUUID(): string {
		const registrationUUID = new UUID().toString();

		return registrationUUID;
	}

	private blockForbiddenDomains(email: string): void {
		const isBlockedDomain = _isDisposableEmail(email);
		if (isBlockedDomain) {
			throw new BadRequestException('Registration using disposable email domains is not allowed.');
		}
	}

	private async updateRegistration(
		existingRegistration: Registration,
		props: RegistrationCreateProps
	): Promise<Registration> {
		existingRegistration.firstName = props.firstName;
		existingRegistration.lastName = props.lastName;
		existingRegistration.addRoomId(props.roomId);
		await this.saveRegistration(existingRegistration);
		return existingRegistration;
	}

	private async createRegistraton(props: RegistrationCreateProps): Promise<Registration> {
		this.blockForbiddenDomains(props.email);

		const registrationProps: RegistrationProps = {
			...props,
			id: new ObjectId().toHexString(),
			registrationSecret: this.createRegistrationUUID(),
			roomIds: [props.roomId],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const registration = new Registration(registrationProps);

		await this.registrationRepo.save(registration);

		return registration;
	}
}
