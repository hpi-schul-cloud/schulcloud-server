import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolConfigurationTemplateResponse } from './context-external-tool-configuration-template.response';

export class ContextExternalToolConfigurationTemplateListResponse {
	@ApiProperty({ type: [ContextExternalToolConfigurationTemplateResponse] })
	data: ContextExternalToolConfigurationTemplateResponse[];

	constructor(data: ContextExternalToolConfigurationTemplateResponse[]) {
		this.data = data;
	}
}
