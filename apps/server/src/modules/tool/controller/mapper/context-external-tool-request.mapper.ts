import { CustomParameterEntryDO } from '@shared/domain/domainobject/tool';
import { ContextExternalTool } from '../../uc/dto';
import { ContextExternalToolPostParams, CustomParameterEntryParam } from '../dto';

export class ContextExternalToolRequestMapper {
	static mapContextExternalToolRequest(request: ContextExternalToolPostParams): ContextExternalTool {
		return {
			schoolToolId: request.schoolToolId,
			contextToolName: request.contextToolName ?? '',
			contextType: request.contextType,
			contextId: request.contextId,
			toolVersion: request.toolVersion,
			parameters: this.mapRequestToCustomParameterEntryDO(request.parameters),
		};
	}

	private static mapRequestToCustomParameterEntryDO(
		customParameterParams: CustomParameterEntryParam[]
	): CustomParameterEntryDO[] {
		return customParameterParams.map((customParameterParam: CustomParameterEntryParam) => {
			return {
				name: customParameterParam.name,
				value: customParameterParam.value,
			};
		});
	}
}
