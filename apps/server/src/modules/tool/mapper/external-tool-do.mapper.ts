import { Injectable } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import {
	CustomParameterProperty,
	ExternalToolConfigProperty,
	ExternalToolDO,
} from '@shared/domain/domainobject/external-tool.do';
import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { CustomParameterLocation, CustomParameterScope, CustomParameterType } from '@shared/domain';
import { CustomParameterMapper } from '@src/modules/tool/mapper/custom-parameter.mapper';

@Injectable()
export class ExternalToolDOMapper {
	constructor(private readonly customParameterMapper: CustomParameterMapper) {}

	mapRequestToExternalToolDO(externalToolParams: ExternalToolParams): ExternalToolDO {
		const config: ExternalToolConfigProperty = this.mapExternalToolConfigToDO(externalToolParams.config);
		const customParameter: CustomParameterProperty = this.mapExternalToolCustomParameterToDO(
			externalToolParams.parameters
		);
		return new ExternalToolDO({ ...externalToolParams });
	}

	private mapExternalToolConfigToDO(externalToolConfigParams: ExternalToolConfigCreateParams) {
		return new ExternalToolConfigProperty({ ...externalToolConfigParams });
	}

	private mapExternalToolCustomParameterToDO(
		customParameterParams: CustomParameterCreateParams[]
	): CustomParameterProperty[] {
		let customParameterPropertyArr: CustomParameterProperty[];
		customParameterParams.forEach((customParameterParam: CustomParameterCreateParams) => {
			const mapScopeElement: CustomParameterScope = this.customParameterMapper.mapScope[customParameterParam.scope];
			const locationParam: CustomParameterLocation =
				this.customParameterMapper.mapLocation[customParameterParam.location];
			const typeParam: CustomParameterType = this.customParameterMapper.mapType[customParameterParam.type];
			const mappedCustomParameterParam: CustomParameterProperty = new CustomParameterProperty({
				name: customParameterParam.name,
				default: customParameterParam.default,
				regex: customParameterParam.regex || '',
				scope: scopeParam,
				location: locationParam,
				type: typeParam,
			});
			customParameterPropertyArr.push(mappedCustomParameterParam);
		});

		return [];
	}
}
