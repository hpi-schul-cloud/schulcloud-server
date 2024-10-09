import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PreferedToolResponse {
	@ApiProperty({ type: String, description: 'Id of the school external tool' })
	schoolExternalToolId: string;

	@ApiProperty({ type: String, description: 'Name of the external tool' })
	name: string;

	@ApiPropertyOptional({
		type: String,
		description: 'Name of the icon to be rendered when displaying it as a preferred tool',
	})
	iconName?: string;

	constructor(configuration: PreferedToolResponse) {
		this.schoolExternalToolId = configuration.schoolExternalToolId;
		this.name = configuration.name;
		this.iconName = configuration.iconName;
	}
}
