import { Injectable } from '@nestjs/common';
import { CustomParameterEntryDO } from '@shared/domain';
import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../dto';
import { SchoolExternalTool } from '../../uc/dto';

@Injectable()
export class SchoolExternalToolRequestMapper {
	mapSchoolExternalToolRequest(request: SchoolExternalToolPostParams): SchoolExternalTool {
		return {
			toolId: request.toolId,
			schoolId: request.schoolId,
			toolVersion: request.version,
			parameters: this.mapRequestToCustomParameterEntryDO(request.parameters ?? []),
		};
	}

	private mapRequestToCustomParameterEntryDO(
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
