import { ApiProperty } from '@nestjs/swagger';
import { ContextExternalToolType } from '../../../context-external-tool/entity';

export class SchoolExternalToolMetadataResponse {
	@ApiProperty()
	contextExternalToolCountPerContext: Record<ContextExternalToolType, number>;

	constructor(schoolExternalToolMetadataResponse: SchoolExternalToolMetadataResponse) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
