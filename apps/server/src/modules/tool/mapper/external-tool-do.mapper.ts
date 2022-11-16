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
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';

@Injectable()
export class ExternalToolMapper {
	constructor(private readonly customParameterMapper: CustomParameterMapper) {}

	mapRequestToExternalToolDO(externalToolParams: ExternalToolParams, version: number): ExternalToolDO {
		let mappedConfig: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;
		if (externalToolParams.config instanceof BasicToolConfigParams) {
			mappedConfig = this.mapBasicToolConfig(externalToolParams.config);
		} else if (externalToolParams.config instanceof Lti11ToolConfigParams) {
			mappedConfig = this.mapLti11ToolConfig(externalToolParams.config);
		} else {
			mappedConfig = this.mapOauth2ToolConfig(externalToolParams.config);
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
			return new CustomParameterDO({
				name: customParameterParam.name,
				default: customParameterParam.default,
				regex: customParameterParam.regex,
				scope: this.customParameterMapper.mapScope(customParameterParam.scope),
				location: this.customParameterMapper.mapLocation(customParameterParam.location),
				type: this.customParameterMapper.mapType(customParameterParam.type),
			});
		});
	}

	mapDoToProviderOauthClient(name: string, oauth2Config: Oauth2ToolConfigDO): ProviderOauthClient {
		return {
			client_name: name,
			client_id: oauth2Config.clientId,
			client_secret: oauth2Config.clientSecret,
			scope: oauth2Config.scope,
			token_endpoint_auth_method: oauth2Config.tokenEndpointAuthMethod,
			redirect_uris: oauth2Config.redirectUris,
			frontchannel_logout_uri: oauth2Config.frontchannelLogoutUri,
			subject_type: 'pairwise',
		};
	}

	applyProviderOauthClientToDO(oauth2Config: Oauth2ToolConfigDO, oauthClient: ProviderOauthClient): Oauth2ToolConfigDO {
		return new Oauth2ToolConfigDO({
			...oauth2Config,
			scope: oauthClient.scope,
			tokenEndpointAuthMethod: oauthClient.token_endpoint_auth_method,
			redirectUris: oauthClient.redirect_uris,
			frontchannelLogoutUri: oauthClient.frontchannel_logout_uri,
		});
	}
}
