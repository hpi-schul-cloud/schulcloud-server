import { Injectable } from '@nestjs/common';
import { CustomParameterEntry } from '../../common/domain';
import {
	CustomParameterEntryParam,
	SchoolExternalToolConfigurationStatus,
	SchoolExternalToolPostParams,
} from '../controller/dto';
import { SchoolExternalToolDto } from '../uc/dto/school-external-tool.types';

@Injectable()
export class SchoolExternalToolRequestMapper {
	mapSchoolExternalToolRequest(request: SchoolExternalToolPostParams): SchoolExternalToolDto {
		return {
			toolId: request.toolId,
			schoolId: request.schoolId,
			toolVersion: request.version,
			parameters: this.mapRequestToCustomParameterEntryDO(request.parameters ?? []),
			status: new SchoolExternalToolConfigurationStatus({
				isOutdatedOnScopeSchool: false,
				isDeactivated: request.isDeactivated,
			}),
		};
	}

	private mapRequestToCustomParameterEntryDO(
		customParameterParams: CustomParameterEntryParam[]
	): CustomParameterEntry[] {
		return customParameterParams.map((customParameterParam: CustomParameterEntryParam) => {
			return {
				name: customParameterParam.name,
				value: customParameterParam.value || undefined,
			};
		});
	}
}
