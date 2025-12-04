import { Mail } from '@infra/mail';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

export interface RegistrationProps extends AuthorizableObject {
	id: EntityId;
	email: string;
	firstName: string;
	lastName: string;
	roomIds: EntityId[];
	registrationSecret: string;
	createdAt: Date;
	updatedAt: Date;
}

export type RegistrationCreateProps = {
	email: string;
	firstName: string;
	lastName: string;
	roomId: EntityId;
};

type MailContent = {
	text: string;
	html: string;
};

export class Registration extends DomainObject<RegistrationProps> {
	constructor(props: RegistrationProps) {
		super(props);
	}

	public getProps(): RegistrationProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get email(): string {
		return this.props.email;
	}

	get firstName(): string {
		return this.props.firstName;
	}

	set firstName(value: string) {
		this.props.firstName = value;
	}

	get lastName(): string {
		return this.props.lastName;
	}

	set lastName(value: string) {
		this.props.lastName = value;
	}

	get roomIds(): EntityId[] {
		return this.props.roomIds;
	}

	get registrationSecret(): string {
		return this.props.registrationSecret;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	public updateName(value: { firstName: string; lastName: string }): void {
		this.props.firstName = value.firstName;
		this.props.lastName = value.lastName;
	}

	public addRoomId(roomId: EntityId): void {
		if (this.roomIds.includes(roomId)) {
			return;
		}

		this.props.roomIds.push(roomId);
	}

	public generateRegistrationMail(): Mail {
		const registrationLink = this.generateRegistrationLink(this.registrationSecret);
		const mailContent = this.generateRegistrationMailContent(this.firstName, this.lastName, registrationLink);
		const senderAddress = Configuration.get('SMTP_SENDER') as string;
		const completeMail: Mail = {
			mail: {
				subject: 'Einladung Externe Person',
				htmlContent: mailContent.html,
				plainTextContent: mailContent.text,
			},
			recipients: [this.email],
			from: senderAddress,
		};
		return completeMail;
	}

	private generateRegistrationLink(secret: string): string {
		const hostUrl = Configuration.get('HOST') as string;
		const baseRegistrationUrl = `${hostUrl}/registration-external-members/`;
		const registrationLink = `${baseRegistrationUrl}?registrationSecret=${secret}`;

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
