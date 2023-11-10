import { ApiProperty } from '@nestjs/swagger';
import { ToolContextType } from '../../../../common/enum';

export class ExternalToolMetadataResponse {
	@ApiProperty()
	schoolExternalToolCount: number;

	@ApiProperty()
	contextExternalToolCountPerContext: Map<ToolContextType, number>;

	constructor(externalToolMetadataResponse: ExternalToolMetadataResponse) {
		this.schoolExternalToolCount = externalToolMetadataResponse.schoolExternalToolCount;
		this.contextExternalToolCountPerContext = externalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
