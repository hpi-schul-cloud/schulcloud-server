import { EntityId } from '@shared/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToolConfigurationEntryResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	constructor(response: ToolConfigurationEntryResponse) {
		this.id = response.id;
		this.name = response.name;
		this.logoUrl = response.logoUrl;
	}
}
