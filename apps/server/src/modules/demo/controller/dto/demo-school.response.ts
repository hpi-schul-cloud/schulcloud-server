import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreationProtocol } from '../../types';

export class DemoSchoolResponse {
	constructor({ id, type, key, children }: CreationProtocol) {
		this.id = id;
		this.type = type;
		this.key = key;
		const childResponses = children?.map((c) => new DemoSchoolResponse(c));
		this.children = childResponses;
	}

	@ApiPropertyOptional({
		pattern: '[a-f0-9]{24}',
	})
	id: string | undefined;

	@ApiPropertyOptional({
		description: 'Title of the Board',
	})
	key: string | undefined;

	@ApiProperty({
		description: 'Title of the Board',
	})
	type: string;

	@ApiPropertyOptional({
		description: 'Title of the Board',
	})
	children: DemoSchoolResponse[] | undefined;
}
