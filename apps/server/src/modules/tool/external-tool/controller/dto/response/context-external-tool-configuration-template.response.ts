import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { CustomParameterResponse } from './custom-parameter.response';

export class ContextExternalToolConfigurationTemplateResponse {
	@ApiProperty()
	externalToolId: EntityId;

	@ApiProperty()
	schoolExternalToolId: EntityId;

	@ApiProperty()
	name: string;

	@ApiProperty()
	baseUrl: string;

	@ApiPropertyOptional()
	logoUrl?: string;

	@ApiProperty({ type: [CustomParameterResponse] })
	parameters: CustomParameterResponse[];

	constructor(configuration: ContextExternalToolConfigurationTemplateResponse) {
		this.externalToolId = configuration.externalToolId;
		this.schoolExternalToolId = configuration.schoolExternalToolId;
		this.name = configuration.name;
		this.baseUrl = configuration.baseUrl;
		this.logoUrl = configuration.logoUrl;
		this.parameters = configuration.parameters;
	}
}
