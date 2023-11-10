import { ToolContextType } from '../../common/enum';
import { ExternalToolMetadataResponse } from '../controller/dto/response/external-tool-metadata.response';
import { ExternalToolMetadata } from '../domain/external-tool-metadata';

export class ExternalToolMetadataMapper {
	static mapExternalToolMetadata(
		schoolExternalToolCount: number,
		toolCountPerContext: { ToolContextType; number }[]
	): ExternalToolMetadata {
		const contextExternalToolMetadata: Map<ToolContextType, number> = new Map(
			toolCountPerContext.map((contextExternalToolCountPerContext: { ToolContextType; number }) => [
				contextExternalToolCountPerContext.ToolContextType,
				contextExternalToolCountPerContext.number,
			])
		);

		const externalToolMetadata: ExternalToolMetadata = new ExternalToolMetadata({
			schoolExternalToolCount,
			contextExternalToolCountPerContext: contextExternalToolMetadata,
		});

		return externalToolMetadata;
	}

	static mapToExternalToolMetadataResponse(externalToolMetadata: ExternalToolMetadata): ExternalToolMetadataResponse {
		const externalToolMetadataResponse: ExternalToolMetadataResponse = new ExternalToolMetadataResponse({
			schoolExternalToolCount: externalToolMetadata.schoolExternalToolCount,
			contextExternalToolCountPerContext: externalToolMetadata.contextExternalToolCountPerContext,
		});

		return externalToolMetadataResponse;
	}
}
