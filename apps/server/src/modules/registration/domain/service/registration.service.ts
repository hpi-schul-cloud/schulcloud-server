import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Mail } from '@infra/mail';
import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException, Injectable } from '@nestjs/common';
import { isDisposableEmail as _isDisposableEmail } from 'disposable-email-domains-js';
import { RegistrationRepo } from '../../repo';
import { Registration, RegistrationCreateProps, RegistrationProps } from '../do';
import { UUID } from 'bson';
import { CreateOrUpdateRegistrationBodyParams } from '@modules/registration/api/dto/request/create-registration.body.params';

type MailContent = {
	text: string;
	html: string;
};

@Injectable()
export class RegistrationService {
	constructor(private readonly registrationRepo: RegistrationRepo) {}

	public async fetchAndUpdateRegistrationByEmail(
		props: CreateOrUpdateRegistrationBodyParams
	): Promise<Registration | null> {
		const existingRegistration = await this.getSingleRegistrationByEmail(props.email);
		if (existingRegistration) {
			existingRegistration.firstName = props.firstName;
			existingRegistration.lastName = props.lastName;
			existingRegistration.addRoomId(props.roomId);
			await this.saveRegistration(existingRegistration);
			return existingRegistration;
		}
		return null;
	}

	public async createOrUpdateRegistration(props: RegistrationCreateProps): Promise<Registration> {
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

	// can also be used for resending mail functionality later
	// also think about updating registration object with resentAt timestamp
	public generateRegistrationMail(email: string, firstName: string, lastName: string, hash: string): Mail {
		const registrationLink = this.generateRegistrationLink(hash);
		const mailContent = this.generateRegistrationMailContent(firstName, lastName, registrationLink);
		const senderAddress = Configuration.get('SMTP_SENDER') as string;
		const completeMail: Mail = {
			mail: {
				subject: 'Einladung Externe Person',
				htmlContent: mailContent.html,
				plainTextContent: mailContent.text,
			},
			recipients: [email],
			from: senderAddress,
		};
		return completeMail;
	}

	private generateRegistrationLink(hash: string): string {
		const hostUrl = Configuration.get('HOST') as string;
		const baseRegistrationUrl = `${hostUrl}/registration-external-members/`;
		const registrationLink = `${baseRegistrationUrl}?registrationHash=${hash}`;

		return registrationLink;
	}

	private generateRegistrationMailContent(firstName: string, lastName: string, registrationLink: string): MailContent {
		const mailContent = {
			text: `Einladung für ${firstName} ${lastName} bitte nutze folgenden Link zur Registrierung: ${registrationLink}`,
			html: `<p>Einladung für ${firstName} ${lastName}</p><p>Bitte nutze folgenden Link zur Registrierung: <a href="${registrationLink}">${registrationLink}</a></p>`,
		};
		return mailContent;
	}
}
