import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomParameterEntryResponse {
	@ApiProperty()
	name: string;

	@ApiProperty()
	@ApiPropertyOptional()
	value?: string;

	constructor(props: CustomParameterEntryResponse) {
		this.name = props.name;
		this.value = props.value;
	}
}
