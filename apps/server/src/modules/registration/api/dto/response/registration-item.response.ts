import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { LanguageType } from '@shared/domain/interface';
import { Consent } from '../../../domain/type';

export class RegistrationItemResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public email: string;

	@ApiProperty()
	public firstName: string;

	@ApiProperty()
	public lastName: string;

	// do we want to expose the password in the response?
	@ApiProperty()
	public password: string;

	@ApiProperty({ enum: Consent, isArray: true, enumName: 'Consent' })
	@IsArray()
	@IsEnum(Consent, { each: true })
	public consent: Consent[];

	@ApiProperty({ enum: LanguageType, enumName: 'LanguageType' })
	@IsEnum(LanguageType)
	public language: LanguageType;

	@ApiProperty()
	@IsArray()
	public roomIds: string[];

	@ApiProperty()
	public registrationHash: string;

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public updatedAt: Date;

	constructor(registration: RegistrationItemResponse) {
		this.id = registration.id;
		this.email = registration.email;
		this.firstName = registration.firstName;
		this.lastName = registration.lastName;
		this.password = registration.password;
		this.consent = registration.consent;
		this.language = registration.language;
		this.roomIds = registration.roomIds;
		this.registrationHash = registration.registrationHash;
		this.createdAt = registration.createdAt;
		this.updatedAt = registration.updatedAt;
	}
}
