import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';

export class PreferedToolResponse {
	@ApiProperty()
	schoolExternalToolId: EntityId;

	@ApiProperty()
	name: string;

	@ApiProperty()
	icon: string;

	constructor(configuration: PreferedToolResponse) {
		this.schoolExternalToolId = configuration.schoolExternalToolId;
		this.name = configuration.name;
		this.icon = configuration.icon;
	}
}
