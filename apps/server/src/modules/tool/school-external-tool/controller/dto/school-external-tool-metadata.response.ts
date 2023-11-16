import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolType } from '../../../context-external-tool/entity';

export class SchoolExternalToolMetadataResponse {
	@ApiProperty({
		type: 'object',
		properties: Object.fromEntries(
			Object.values(ContextExternalToolType).map((key: ContextExternalToolType) => [key, { type: 'number' }])
		),
	})
	contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(schoolExternalToolMetadataResponse: SchoolExternalToolMetadataResponse) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
