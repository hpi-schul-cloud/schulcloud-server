import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrationItemResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	firstName: string;

	@ApiProperty()
	lastName: string;

	@ApiProperty({ type: Date })
	createdAt: Date;

	@ApiProperty({ type: Date })
	updatedAt: Date;

	@ApiPropertyOptional({ type: Boolean, default: false })
	registeredUserExists: boolean;

	constructor(registration: RegistrationItemResponse) {
		this.id = registration.id;
		this.email = registration.email;
		this.firstName = registration.firstName;
		this.lastName = registration.lastName;
		this.registeredUserExists = registration.registeredUserExists;
		this.createdAt = registration.createdAt;
		this.updatedAt = registration.updatedAt;
	}
}
