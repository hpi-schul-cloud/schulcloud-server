import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { CustomParameterResponse } from './custom-parameter.response';
import { ToolContextType } from '@modules/tool/common/enum';

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

	@ApiProperty({ enum: ToolContextType, enumName: 'ToolContextType', isArray: true })
	validContexts: ToolContextType[];

	constructor(configuration: SchoolExternalToolConfigurationTemplateResponse) {
		this.externalToolId = configuration.externalToolId;
		this.name = configuration.name;
		this.baseUrl = configuration.baseUrl;
		this.logoUrl = configuration.logoUrl;
		this.parameters = configuration.parameters;
		this.validContexts = configuration.validContexts;
	}
}
