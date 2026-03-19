import { Mail, PlainTextMailContent } from '@infra/mail';
import { RegistrationConfig } from '@modules/registration/registration.config';
import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';

export interface RegistrationProps extends AuthorizableObject {
	id: EntityId;
	email: string;
	firstName: string;
	lastName: string;
	roomIds: EntityId[];
	registrationSecret: string;
	createdAt: Date;
	updatedAt: Date;
	resentAt?: Date;
}

export type RegistrationCreateProps = {
	email: string;
	firstName: string;
	lastName: string;
	roomId: EntityId;
};

export class Registration extends DomainObject<RegistrationProps> {
	constructor(props: RegistrationProps) {
		super(props);
	}

	public getProps(): RegistrationProps {
		// We need to make sure that only properties of type T are returned
		// At runtime the props are a MikroORM entity that has additional non-persisted properties
		// see @Property({ persist: false })
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

	get resentAt(): Date | undefined {
		return this.props.resentAt;
	}

	set resentAt(value: Date | undefined) {
		this.props.resentAt = value;
	}

	public updateName(value: { firstName: string; lastName: string }): void {
		this.props.firstName = value.firstName;
		this.props.lastName = value.lastName;
	}

	public addRoomId(roomId: EntityId): void {
		if (this.roomIds.includes(roomId)) {
			return;
		}

		this.props.roomIds = [...this.props.roomIds, roomId];
	}

	public removeRoomId(roomId: EntityId): void {
		this.props.roomIds = this.props.roomIds.filter((id) => id !== roomId);
	}

	public hasNoRoomIds(): boolean {
		return this.props.roomIds.length === 0;
	}

	public generateRegistrationMail(roomName: string, config: RegistrationConfig): Mail {
		const mailContent = this.generateRegistrationMailContent(roomName, config);
		const senderAddress = config.fromEmailAddress;
		const completeMail: Mail = {
			mail: mailContent,
			recipients: [this.email],
			from: senderAddress,
		};
		return completeMail;
	}

	private generateRegistrationLink(config: RegistrationConfig): string {
		const { hostUrl } = config;
		const baseRegistrationUrl = `${hostUrl}/registration-external-members/`;
		const registrationLink = `${baseRegistrationUrl}?registration-secret=${this.registrationSecret}`;

		return registrationLink;
	}

	private generateRegistrationMailContent(roomName: string, config: RegistrationConfig): PlainTextMailContent {
		const stripTags = (html: string): string =>
			html
				.replace(/<hr\s*\/?>/gim, '\n\n------------\n\n')
				.replace(/<(\/p>|<br\s*\/)>/gim, '\n')
				.replace(/<\/?[^>]+(>|$)/g, '');

		const productName = config.scTitle;
		const subject = `${productName}: Einladung zur Registrierung und Zugriff auf den Raum ${roomName}`;
		const registrationLink = this.generateRegistrationLink(config);

		const germanHtml = `Hallo ${this.firstName} ${this.lastName},
<p>dies ist eine Einladung, dem Raum ${roomName} beizutreten. Um den Raum betreten zu können, ist eine Registrierung in der ${productName} erforderlich. Bitte auf den folgenden Link klicken, um die Registrierung vorzunehmen:<br />
${registrationLink}<br />
Hinweis: Der Link sollte nicht weitergegeben und nur in einer sicheren Umgebung verwendet werden.<br />
Nach der Registrierung wird der Zugriff auf den Raum ${roomName} sofort freigeschaltet.
</p>
Mit freundlichen Grüßen<br />
${productName}-Team`;

		const englishHtml = `Hello ${this.firstName} ${this.lastName},
<p>This is an invitation to join the ${roomName} room. To enter the room, you must register with ${productName}. Please click on the following link to register:<br />
${registrationLink}<br />
Note: The link should not be shared and should only be used in a secure environment.<br />
After registration, access to the room ${roomName} will be activated immediately.
</p>
Best regards,<br />
${productName} team`;

		const htmlContent = `<html><body><div lang="de">${germanHtml}</div><hr /><div lang="en">${englishHtml}</div></body></html>`;

		const mailContent = {
			subject,
			plainTextContent: stripTags(htmlContent),
			htmlContent: '',
		};
		return mailContent;
	}
}
