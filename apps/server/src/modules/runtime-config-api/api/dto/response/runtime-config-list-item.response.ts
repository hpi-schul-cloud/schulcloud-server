import { RuntimeConfigType, RuntimeConfigValueType } from '@infra/runtime-config';
import { ApiProperty } from '@nestjs/swagger';

export class RuntimeConfigListItemResponse {
	@ApiProperty()
	key: string;

	@ApiProperty({ enum: ['string', 'number', 'boolean'] })
	type: RuntimeConfigType;

	@ApiProperty({
		description: 'guaranteed to be of the type defined in "type" property',
		oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
	})
	value: RuntimeConfigValueType;

	@ApiProperty({
		required: false,
	})
	description?: string;

	constructor(item: RuntimeConfigListItemResponse) {
		this.key = item.key;
		this.type = item.type;
		this.value = item.value;
		this.description = item.description;
	}
}
