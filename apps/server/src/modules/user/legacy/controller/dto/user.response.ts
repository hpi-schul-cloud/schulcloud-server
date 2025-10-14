import { ApiProperty } from '@nestjs/swagger';
import { ClassResponse } from './class.response';
import { ConsentsResponse } from './consents.response';

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
	}: UserResponse) {
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
	public _id: string;

	@ApiProperty()
	public firstName: string;

	@ApiProperty()
	public lastName: string;

	@ApiProperty()
	public email: string;

	@ApiProperty()
	public createdAt: Date;

	@ApiProperty()
	public birthday?: Date;

	@ApiProperty()
	public preferences?: Record<string, unknown>;

	@ApiProperty()
	public consentStatus: string;

	@ApiProperty()
	public consent?: ConsentsResponse;

	@ApiProperty({ type: [ClassResponse] })
	public classes?: ClassResponse[];

	@ApiProperty()
	public importHash?: string;

	@ApiProperty()
	public lastLoginSystemChange?: Date;

	@ApiProperty()
	public outdatedSince?: Date;
}
