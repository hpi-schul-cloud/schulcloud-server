import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalToolParams } from '@src/modules/tool/controller/dto/request/external-tool-create.params';
import { CustomParameterCreateParams } from '@src/modules/tool/controller/dto/request/custom-parameter.params';
import { CustomParameterMapper } from '@src/modules/tool/mapper/custom-parameter.mapper';
import { BasicToolConfigParams } from '@src/modules/tool/controller/dto/request/basic-tool-config.params';
import { Oauth2ToolConfigParams } from '@src/modules/tool/controller/dto/request/oauth2-tool-config.params';
import { Lti11ToolConfigParams } from '@src/modules/tool/controller/dto/request/lti11-tool-config.params';
import {
	CustomParameterDO,
	ExternalToolDO,
	BasicToolConfigDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool.do';

@Injectable()
export class ExternalToolMapper {
	constructor(private readonly customParameterMapper: CustomParameterMapper) {}

	mapRequestToExternalToolDO(externalToolParams: ExternalToolParams, version: number): ExternalToolDO {
		let mappedConfig: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;
		switch (externalToolParams.config.type) {
			case 'basic': {
				mappedConfig = this.mapBasicToolConfig(externalToolParams.config);
				break;
			}
			case 'lti11': {
				mappedConfig = this.mapLti11ToolConfig(externalToolParams.config as Lti11ToolConfigParams);
				break;
			}
			case 'oauth2': {
				mappedConfig = this.mapOauth2ToolConfig(externalToolParams.config as Oauth2ToolConfigParams);
				break;
			}
			default: {
				throw new InternalServerErrorException('Could not found external tool config');
			}
		}

		const mappedCustomParameter: CustomParameterDO[] = this.mapCustomParameterCreateParamsToDO(
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
			version,
		});
	}

	private mapBasicToolConfig(externalToolConfigParams: BasicToolConfigParams): BasicToolConfigDO {
		return new BasicToolConfigDO({ ...externalToolConfigParams });
	}

	private mapLti11ToolConfig(externalToolConfigParams: Lti11ToolConfigParams): Lti11ToolConfigDO {
		return new Lti11ToolConfigDO({ ...externalToolConfigParams });
	}

	private mapOauth2ToolConfig(externalToolConfigParams: Oauth2ToolConfigParams): Oauth2ToolConfigDO {
		return new Oauth2ToolConfigDO({ ...externalToolConfigParams });
	}

	private mapCustomParameterCreateParamsToDO(
		customParameterParams: CustomParameterCreateParams[]
	): CustomParameterDO[] {
		return customParameterParams.map((customParameterParam: CustomParameterCreateParams) => {
			return {
				name: customParameterParam.name,
				default: customParameterParam.default,
				regex: customParameterParam.regex || '',
				scope: this.customParameterMapper.mapScope(customParameterParam.scope),
				location: this.customParameterMapper.mapLocation(customParameterParam.location),
				type: this.customParameterMapper.mapType(customParameterParam.type),
			};
		});
	}
}
