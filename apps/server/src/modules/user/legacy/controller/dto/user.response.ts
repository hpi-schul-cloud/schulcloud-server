import { ApiProperty } from '@nestjs/swagger';
import { ConsentResponse } from './consent.response';
import { ClassResponse } from './class.response';

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
	}: UserResponse) {
		this._id = _id.toString();
		this.firstName = firstName;
		this.lastName = lastName;
		this.email = email;
		this.createdAt = createdAt;
		this.birthday = birthday;
		this.preferences = preferences;
		this.consentStatus = consentStatus;
		this.consent = consent ? new ConsentResponse(consent) : undefined;
		this.classes = classes;
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
	consent?: ConsentResponse;

	@ApiProperty({ type: [ClassResponse] })
	classes?: ClassResponse[];
}
