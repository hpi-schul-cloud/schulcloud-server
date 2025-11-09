import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { LanguageType } from '@shared/domain/interface';

export class RegistrationItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty()
	password: string;

	@ApiProperty()
	@IsArray()
	consent: string[];

	@ApiProperty()
	pin: string;

	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	language: LanguageType;

	@ApiProperty()
	@IsArray()
	roomIds: string[];

	@ApiProperty()
	registrationHash: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	constructor(registration: RegistrationItemResponse) {
		this.id = registration.id;
		this.email = registration.email;
		this.firstName = registration.firstName;
		this.lastName = registration.lastName;
		this.password = registration.password;
		this.consent = registration.consent;
		this.pin = registration.pin;
		this.language = registration.language;
		this.roomIds = registration.roomIds;
		this.registrationHash = registration.registrationHash;
		this.createdAt = registration.createdAt;
		this.updatedAt = registration.updatedAt;
	}
}
