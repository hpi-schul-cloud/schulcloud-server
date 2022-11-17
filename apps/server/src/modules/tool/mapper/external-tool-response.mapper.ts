import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CustomParameterMapper } from '@src/modules/tool/mapper/custom-parameter.mapper';
import { ExternalToolResponse } from '@src/modules/tool/controller/dto/response/external-tool.response';
import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { BasicToolConfigResponse } from '@src/modules/tool/controller/dto/response/basic-tool-config.response';
import { Oauth2ToolConfigResponse } from '@src/modules/tool/controller/dto/response/oauth2-tool-config.response';
import { CustomParameterResponse } from '@src/modules/tool/controller/dto/response/custom-parameter.response';
import { Lti11ToolConfigResponse } from '../controller/dto/response/lti11-tool-config.response';

@Injectable()
export class ExternalToolResponseMapper {
	mapToResponse(externalToolDO: ExternalToolDO): ExternalToolResponse {
		let mappedConfig: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;
		switch (externalToolDO.config.type) {
			case 'basic': {
				mappedConfig = this.mapBasicToolConfigDO(externalToolDO.config);
				break;
			}
			case 'lti11': {
				mappedConfig = this.mapLti11ToolConfigDO(externalToolDO.config as Lti11ToolConfigDO);
				break;
			}
			case 'oauth2': {
				mappedConfig = this.mapOauth2ToolConfigDO(externalToolDO.config as Oauth2ToolConfigDO);
				break;
			}
			default: {
				throw new InternalServerErrorException('Could not found external tool config');
			}
		}

		const mappedCustomParameter: CustomParameterResponse[] = this.mapCustomParameterToResponse(
			externalToolDO.parameters ?? []
		);

		return new ExternalToolResponse({
			id: externalToolDO.id || '',
			name: externalToolDO.name,
			url: externalToolDO.url,
			logoUrl: externalToolDO.logoUrl,
			config: mappedConfig,
			parameters: mappedCustomParameter,
			isHidden: externalToolDO.isHidden,
			openNewTab: externalToolDO.openNewTab,
			version: externalToolDO.version,
		});
	}

	private mapBasicToolConfigDO(externalToolConfigDO: BasicToolConfigDO): BasicToolConfigResponse {
		return new BasicToolConfigResponse({ ...externalToolConfigDO });
	}

	private mapLti11ToolConfigDO(externalToolConfigDO: Lti11ToolConfigDO): Lti11ToolConfigResponse {
		return new Lti11ToolConfigResponse({ ...externalToolConfigDO });
	}

	private mapOauth2ToolConfigDO(externalToolConfigDO: Oauth2ToolConfigDO): Oauth2ToolConfigResponse {
		return new Oauth2ToolConfigResponse({ ...externalToolConfigDO });
	}

	private mapCustomParameterToResponse(customParameterDOS: CustomParameterDO[]): CustomParameterResponse[] {
		return customParameterDOS.map((customParameterDO: CustomParameterDO) => {
			return {
				name: customParameterDO.name,
				default: customParameterDO.default,
				regex: customParameterDO.regex,
				scope: customParameterDO.scope,
				location: customParameterDO.location,
				type: customParameterDO.type,
			};
		});
	}
}
