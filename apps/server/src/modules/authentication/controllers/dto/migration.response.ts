import { ApiProperty } from '@nestjs/swagger';

export class MigrationResponse {
	@ApiProperty()
	sourceSystem: string;

	@ApiProperty()
	targetSystem: string;

	@ApiProperty()
	mandatory: boolean;

	constructor(props: MigrationResponse) {
		this.sourceSystem = props.sourceSystem;
		this.targetSystem = props.targetSystem;
		this.mandatory = props.mandatory;
	}
}
