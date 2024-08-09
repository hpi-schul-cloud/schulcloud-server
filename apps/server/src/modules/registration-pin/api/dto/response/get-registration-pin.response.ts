import { ApiProperty } from '@nestjs/swagger';

export class GetRegistrationPinResponse {
	@ApiProperty()
	public username: string;

	@ApiProperty()
	registrationPin: string;

	@ApiProperty()
	public verified: boolean;

	@ApiProperty()
	public createdAt: Date;

	constructor(props: Readonly<GetRegistrationPinResponse>) {
		this.username = props.username;
		this.registrationPin = props.registrationPin;
		this.verified = props.verified;
		this.createdAt = props.createdAt;
	}
}
