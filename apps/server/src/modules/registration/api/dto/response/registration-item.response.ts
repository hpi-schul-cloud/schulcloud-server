import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrationItemResponse {
	@ApiProperty()
	public id: string;

	@ApiProperty()
	public email: string;

	@ApiProperty()
	public firstName: string;

	@ApiProperty()
	public lastName: string;

	@ApiProperty({ type: Date })
	public createdAt: Date;

	@ApiProperty({ type: Date })
	public updatedAt: Date;

	@ApiPropertyOptional({ type: Boolean, default: false })
	public registeredUserExists: boolean;

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
