import { ToolContextType } from '../../common/enum';
import { ContextExternalToolType } from '../../context-external-tool/entity';
import { ExternalToolMetadataResponse } from '../controller/dto';
import { ExternalToolMetadata } from '../domain';

export class ExternalToolMetadataMapper {
	static mapToExternalToolMetadataResponse(externalToolMetadata: ExternalToolMetadata): ExternalToolMetadataResponse {
		const externalToolMetadataResponse: ExternalToolMetadataResponse = new ExternalToolMetadataResponse({
			schoolExternalToolCount: externalToolMetadata.schoolExternalToolCount,
			contextExternalToolCountPerContext: externalToolMetadata.contextExternalToolCountPerContext,
		});

		return externalToolMetadataResponse;
	}
}
