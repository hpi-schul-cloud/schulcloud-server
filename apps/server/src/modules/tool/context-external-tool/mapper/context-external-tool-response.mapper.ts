import { ToolStatusResponseMapper } from '../../common/mapper/tool-status-response.mapper';
import { CustomParameterEntryParam, CustomParameterEntryResponse } from '../../school-external-tool/controller/dto';
import { ContextExternalToolResponse, ToolReferenceResponse } from '../controller/dto';
import { ContextExternalTool, ToolReference } from '../domain';

export class ContextExternalToolResponseMapper {
	static mapContextExternalToolResponse(contextExternalTool: ContextExternalTool): ContextExternalToolResponse {
		const mapped: ContextExternalToolResponse = new ContextExternalToolResponse({
			id: contextExternalTool.id ?? '',
			contextId: contextExternalTool.contextRef.id,
			contextType: contextExternalTool.contextRef.type,
			schoolToolId: contextExternalTool.schoolToolRef.schoolToolId,
			displayName: contextExternalTool.displayName,
			parameters: this.mapRequestToCustomParameterEntryDO(contextExternalTool.parameters),
		});

		return mapped;
	}

	private static mapRequestToCustomParameterEntryDO(
		customParameterParams: CustomParameterEntryParam[]
	): CustomParameterEntryResponse[] {
		const mapped: CustomParameterEntryResponse[] = customParameterParams.map(
			(customParameterParam: CustomParameterEntryParam) => {
				const customParameterEntryResponse: CustomParameterEntryResponse = new CustomParameterEntryResponse({
					name: customParameterParam.name,
					value: customParameterParam.value,
				});

				return customParameterEntryResponse;
			}
		);

		return mapped;
	}

	static mapToToolReferenceResponses(toolReferences: ToolReference[]): ToolReferenceResponse[] {
		const toolReferenceResponses: ToolReferenceResponse[] = toolReferences.map((toolReference: ToolReference) =>
			this.mapToToolReferenceResponse(toolReference)
		);

		return toolReferenceResponses;
	}

	static mapToToolReferenceResponse(toolReference: ToolReference): ToolReferenceResponse {
		const response = new ToolReferenceResponse({
			contextToolId: toolReference.contextToolId,
			description: toolReference.description,
			displayName: toolReference.displayName,
			logoUrl: toolReference.logoUrl,
			thumbnailUrl: toolReference.thumbnailUrl,
			openInNewTab: toolReference.openInNewTab,
			status: ToolStatusResponseMapper.mapToResponse(toolReference.status),
		});

		return response;
	}
}
