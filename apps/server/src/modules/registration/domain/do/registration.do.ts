import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { LanguageType } from '@shared/domain/interface';
import { Consent } from '../type';

export interface RegistrationProps extends AuthorizableObject {
	id: EntityId;
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	consent: Consent[];
	// question if pin is actually needed or if its verification enough to just send the registration to the specific email
	pin: string;
	language: LanguageType;
	roomIds: EntityId[];
	registrationHash: string;
	createdAt: Date;
	updatedAt: Date;
}

export type RegistrationCreateProps = Pick<
	RegistrationProps,
	'email' | 'firstName' | 'lastName' | 'consent' | 'language' | 'roomIds'
>;
export type RegistrationUpdateProps = Pick<RegistrationProps, 'password' | 'consent' | 'pin' | 'language' | 'roomIds'>;

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

	get lastName(): string {
		return this.props.lastName;
	}

	get password(): string {
		return this.props.password;
	}

	set password(value: string) {
		this.props.password = value;
	}

	get consent(): Consent[] {
		return this.props.consent;
	}

	set consent(value: Consent[]) {
		this.props.consent = value;
	}

	get pin(): string {
		return this.props.pin;
	}

	set pin(value: string) {
		this.props.pin = value;
	}

	get language(): LanguageType {
		return this.props.language;
	}

	set language(value: LanguageType) {
		this.props.language = value;
	}

	get roomIds(): EntityId[] {
		return this.props.roomIds;
	}

	set roomIds(value: EntityId[]) {
		this.props.roomIds = value;
	}

	get registrationHash(): string {
		return this.props.registrationHash;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	public addRoomId(roomId: EntityId): void {
		if (this.roomIds.includes(roomId)) {
			return;
		}

		this.props.roomIds.push(roomId);
	}
}
