import { EntityId } from '@shared/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SchoolExternalToolResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	constructor(response: SchoolExternalToolResponse) {
		this.id = response.id;
		this.name = response.name;
		this.logoUrl = response.logoUrl;
	}
}
