import { ApiProperty } from '@nestjs/swagger';

export class GetRegistrationPinResponse {
	@ApiProperty()
	username: string;

	@ApiProperty()
	registrationPin: string;

	@ApiProperty()
	verified: boolean;

	@ApiProperty()
	createdAt: Date;

	constructor(props: Readonly<GetRegistrationPinResponse>) {
		this.username = props.username;
		this.registrationPin = props.registrationPin;
		this.verified = props.verified;
		this.createdAt = props.createdAt;
	}
}
