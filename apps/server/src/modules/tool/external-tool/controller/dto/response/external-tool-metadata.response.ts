import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolType } from '../../../../context-external-tool/entity';

export class ExternalToolMetadataResponse {
	@ApiProperty()
	schoolExternalToolCount: number;

	@ApiProperty({
		type: 'object',
		properties: Object.fromEntries(
			Object.values(ContextExternalToolType).map((key: ContextExternalToolType) => [key, { type: 'number' }])
		),
	})
	contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(externalToolMetadataResponse: ExternalToolMetadataResponse) {
		this.schoolExternalToolCount = externalToolMetadataResponse.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
