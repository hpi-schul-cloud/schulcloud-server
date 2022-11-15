import { Injectable } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import {
	CustomParameterProperty,
	ExternalToolConfigProperty,
	ExternalToolDO,
} from '@shared/domain/domainobject/external-tool.do';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { CustomParameterMapper } from '@src/modules/tool/mapper/custom-parameter.mapper';
import { BasicToolConfigParams } from '@src/modules/tool/controller/dto/request/basic-tool-config.params';

@Injectable()
export class ExternalToolMapper {
	constructor(private readonly customParameterMapper: CustomParameterMapper) {}

	mapRequestToExternalToolDO(externalToolParams: ExternalToolParams): ExternalToolDO {
		const mappedConfig: ExternalToolConfigProperty = this.mapExternalToolConfigToDO(externalToolParams.config);
		const mappedCustomParameter: CustomParameterProperty[] = this.mapCustomParameterCreateParamsToProperty(
			externalToolParams.parameters ?? []
		);

		return new ExternalToolDO({
			name: externalToolParams.name,
			url: externalToolParams.url,
			logoUrl: externalToolParams.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolParams.isHidden,
			openNewTab: externalToolParams.openNewTab,
			version: externalToolParams.version,
		});
	}

	private mapExternalToolConfigToDO(externalToolConfigParams: BasicToolConfigParams): ExternalToolConfigProperty {
		return new ExternalToolConfigProperty({ ...externalToolConfigParams });
	}

	private mapCustomParameterCreateParamsToProperty(
		customParameterParams: CustomParameterCreateParams[]
	): CustomParameterProperty[] {
		return customParameterParams.map((customParameterParam: CustomParameterCreateParams) => {
			return {
				name: customParameterParam.name,
				default: customParameterParam.default,
				regex: customParameterParam.regex || '',
				scope: this.customParameterMapper.mapScope(customParameterParam.scope),
				location: this.customParameterMapper.mapLocation(customParameterParam.location),
				type: this.customParameterMapper.mapType(customParameterParam.type),
			} as CustomParameterProperty;
		});
	}
}
