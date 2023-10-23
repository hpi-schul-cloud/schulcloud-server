import { ApiProperty } from '@nestjs/swagger';

export class ExternalSourceResponse {
	@ApiProperty()
	externalId: string;

	@ApiProperty()
	systemId: string;

	constructor(props: ExternalSourceResponse) {
		this.externalId = props.externalId;
		this.systemId = props.systemId;
	}
}
