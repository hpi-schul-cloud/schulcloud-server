import { ApiProperty } from '@nestjs/swagger';
import { type ObjectId } from '@mikro-orm/mongodb';
import { ConsentsResponse, type ConsentsResponseProps } from './consents.response';

export type UserResponseProps = Omit<UserResponse, '_id' | 'consent'> & {
	_id: string | ObjectId;
	consent?: ConsentsResponseProps;
};

export class UserResponse {
	constructor({
		_id,
		firstName,
		lastName,
		email,
		createdAt,
		birthday,
		preferences,
		consentStatus,
		consent,
		classes,
		importHash,
		lastLoginSystemChange,
		outdatedSince,
	}: UserResponseProps) {
		this._id = _id.toString();
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		this.createdAt = createdAt;
		this.birthday = birthday;
		this.preferences = preferences;
		this.consentStatus = consentStatus;
		this.consent = consent ? new ConsentsResponse(consent) : undefined;
		this.classes = classes;
		this.importHash = importHash;
		this.lastLoginSystemChange = lastLoginSystemChange;
		this.outdatedSince = outdatedSince;
	}

	@ApiProperty()
	_id: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	birthday?: Date;

	@ApiProperty()
	preferences?: Record<string, unknown>;

	@ApiProperty()
	consentStatus: string;

	@ApiProperty()
	consent?: ConsentsResponse;

	@ApiProperty({ type: [String] })
	classes?: string[];

	@ApiProperty()
	importHash?: string;

	@ApiProperty()
	lastLoginSystemChange?: Date;

	@ApiProperty()
	outdatedSince?: Date;
}
