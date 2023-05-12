import { Injectable } from '@nestjs/common';
import { CustomParameterEntryDO } from '@shared/domain';
import { SchoolExternalTool } from '../../uc/dto';
import { SchoolExternalToolPostParams } from '../dto';
import { CustomParameterEntryParam } from '../../../common/dto';

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
