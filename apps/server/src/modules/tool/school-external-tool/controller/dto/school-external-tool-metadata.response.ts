import { ApiProperty } from '@nestjs/swagger';
import { ToolContextType } from '../../../common/enum';

export class SchoolExternalToolMetadataResponse {
	@ApiProperty()
	contextExternalToolCountPerContext: Map<ToolContextType, number>;

	constructor(schoolExternalToolMetadataResponse: SchoolExternalToolMetadataResponse) {
		this.contextExternalToolCountPerContext = schoolExternalToolMetadataResponse.contextExternalToolCountPerContext;
	}
}
