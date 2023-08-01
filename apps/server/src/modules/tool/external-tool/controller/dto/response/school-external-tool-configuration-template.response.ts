import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { CustomParameterResponse } from './custom-parameter.response';

export class SchoolExternalToolConfigurationTemplateResponse {
	@ApiProperty()
	externalToolId: EntityId;

	@ApiProperty()
	name: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	@ApiProperty({ type: [CustomParameterResponse] })
	parameters: CustomParameterResponse[];

	@ApiProperty()
	version: number;

	constructor(configuration: SchoolExternalToolConfigurationTemplateResponse) {
		this.externalToolId = configuration.externalToolId;
		this.name = configuration.name;
		this.logoUrl = configuration.logoUrl;
		this.parameters = configuration.parameters;
		this.version = configuration.version;
	}
}
