import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreationProtocol, CreationProtocolEntityType } from '../../types';

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
		description: 'relevant identifier for the object (course.name, user.email, ...)',
	})
	key: string | undefined;

	@ApiProperty({
		description: 'type of the created entity',
	})
	type: CreationProtocolEntityType;

	@ApiPropertyOptional({
		description: 'child entities that were also created',
	})
	children: DemoSchoolResponse[] | undefined;
}
