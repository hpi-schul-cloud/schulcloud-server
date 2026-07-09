import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { CustomParameterResponse } from './custom-parameter.response';
import { ExternalToolMediumResponse } from './external-tool-medium.response';

export class SchoolExternalToolConfigurationTemplateResponse {
	@ApiProperty()
	externalToolId: EntityId;

	@ApiProperty()
	name: string;

	@ApiProperty()
	baseUrl: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	@ApiProperty({ type: [CustomParameterResponse] })
	parameters: CustomParameterResponse[];

	@ApiPropertyOptional({ type: ExternalToolMediumResponse, description: 'Medium of the external tool' })
	medium?: ExternalToolMediumResponse;

	constructor(configuration: SchoolExternalToolConfigurationTemplateResponse) {
		this.externalToolId = configuration.externalToolId;
		this.name = configuration.name;
		this.baseUrl = configuration.baseUrl;
		this.logoUrl = configuration.logoUrl;
		this.parameters = configuration.parameters;
		this.medium = configuration.medium;
	}
}
