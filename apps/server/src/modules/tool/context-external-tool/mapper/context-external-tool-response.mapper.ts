import { ToolStatusResponseMapper } from '../../common/mapper/tool-status-response.mapper';
import { CustomParameterEntryParam } from '../../school-external-tool/controller/dto/custom-parameter-entry.params';
import { CustomParameterEntryResponse } from '../../school-external-tool/controller/dto/custom-parameter-entry.response';
import { ContextExternalToolResponse } from '../controller/dto/context-external-tool.response';
import { ToolReferenceResponse } from '../controller/dto/tool-reference.response';
import { ContextExternalTool } from '../domain/context-external-tool.do';
import { ToolReference } from '../domain/tool-reference';

export class ContextExternalToolResponseMapper {
	static mapContextExternalToolResponse(contextExternalTool: ContextExternalTool): ContextExternalToolResponse {
		const mapped: ContextExternalToolResponse = new ContextExternalToolResponse({
			id: contextExternalTool.id ?? '',
			contextId: contextExternalTool.contextRef.id,
			contextType: contextExternalTool.contextRef.type,
			schoolToolId: contextExternalTool.schoolToolRef.schoolToolId,
			displayName: contextExternalTool.displayName,
			toolVersion: contextExternalTool.toolVersion,
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
			displayName: toolReference.displayName,
			logoUrl: toolReference.logoUrl,
			openInNewTab: toolReference.openInNewTab,
			status: ToolStatusResponseMapper.mapToResponse(toolReference.status),
		});

		return response;
	}
}
