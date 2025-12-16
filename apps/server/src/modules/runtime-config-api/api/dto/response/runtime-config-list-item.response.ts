import { ApiProperty } from '@nestjs/swagger';

export class RuntimeConfigListItemResponse {
	@ApiProperty()
	public key: string;

	@ApiProperty({ enum: ['string', 'number', 'boolean'] })
	public type: string;

	@ApiProperty({ description: 'guaranteed to be of the type defined in "type" property' })
	public value: string | number | boolean;

	@ApiProperty({
		required: false,
	})
	public description?: string;

	constructor(item: RuntimeConfigListItemResponse) {
		this.key = item.key;
		this.type = item.type;
		this.value = item.value;
		this.description = item.description;
	}
}
