import { CustomParameterEntryDO } from '@shared/domain/domainobject/tool';
import { ContextExternalTool } from '../../uc/dto';
import { ContextExternalToolPostParams, CustomParameterEntryParam } from '../dto';

export class ContextExternalToolRequestMapper {
	static mapContextExternalToolRequest(request: ContextExternalToolPostParams): ContextExternalTool {
		return {
			id: '',
			schoolToolRef: {
				schoolToolId: request.schoolToolId,
			},
			contextRef: {
				id: request.contextId,
				type: request.contextType,
			},
			displayName: request.displayName,
			toolVersion: request.toolVersion,
			parameters: this.mapRequestToCustomParameterEntryDO(request.parameters ?? []),
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
