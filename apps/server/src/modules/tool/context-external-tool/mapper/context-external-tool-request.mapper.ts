import { CustomParameterEntryDO } from '@shared/domain/domainobject/tool';
import { ContextExternalToolPostParams } from '../controller/dto';
import { CustomParameterEntryParam } from '../../school-external-tool/controller/dto';
import { ContextExternalTool } from '../uc/dto/context-external-tool.types';

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
