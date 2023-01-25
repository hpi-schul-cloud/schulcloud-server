import { EntityId } from '@shared/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomParameterResponse } from './custom-parameter.response';
import { CustomParameterEntryResponse } from './custom-parameter-entry.response';

export class ExternalToolConfigurationTemplateResponse {
	@ApiProperty()
	id: EntityId;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	@ApiProperty({ type: [CustomParameterResponse] })
	parameters: CustomParameterResponse[];

	@ApiProperty()
	version: number;

	constructor(configuration: ExternalToolConfigurationTemplateResponse) {
		this.id = configuration.id;
		this.name = configuration.name;
		this.logoUrl = configuration.logoUrl;
		this.parameters = configuration.parameters;
		this.version = configuration.version;
	}
}
