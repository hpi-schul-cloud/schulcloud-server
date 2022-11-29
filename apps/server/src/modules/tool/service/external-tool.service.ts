import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/external-tool';
import { ExternalToolRepo } from '@shared/repo/externaltool/external-tool.repo';
import { IFindOptions } from '@shared/domain';
import { Page } from '@shared/domain/interface/page';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { TokenEndpointAuthMethod } from '../interface/token-endpoint-auth-method.enum';
import { ExternalToolServiceMapper } from './mapper/external-tool-service.mapper';

@Injectable()
export class ExternalToolService {
	constructor(
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly oauthProviderService: OauthProviderService,
		private readonly mapper: ExternalToolServiceMapper, // TODO naming?, location of mapper in directory
		@Inject(DefaultEncryptionService) private readonly encryptionService: IEncryptionService
	) {}

	async createExternalTool(externalToolDO: ExternalToolDO): Promise<ExternalToolDO> {
		if (externalToolDO.config instanceof Lti11ToolConfigDO) {
			externalToolDO.config.secret = this.encryptionService.encrypt(externalToolDO.config.secret);
		} else if (externalToolDO.config instanceof Oauth2ToolConfigDO) {
			const oauthClient: ProviderOauthClient = this.mapper.mapDoToProviderOauthClient(
				externalToolDO.name,
				externalToolDO.config
			);

			await this.oauthProviderService.createOAuth2Client(oauthClient);
		}

		const created: ExternalToolDO = await this.externalToolRepo.save(externalToolDO);
		return created;
	}

	async findExternalTools(
		query: Partial<ExternalToolDO>,
		options: IFindOptions<ExternalToolDO>
	): Promise<Page<ExternalToolDO>> {
		const tools: Page<ExternalToolDO> = await this.externalToolRepo.find(query, options);
		tools.data = await Promise.all(
			tools.data.map(async (tool: ExternalToolDO): Promise<ExternalToolDO> => {
				if (tool.config instanceof Oauth2ToolConfigDO) {
					const oauthClient: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(
						tool.config.clientId
					);
					this.applyProviderOauthClientToDO(tool.config, oauthClient);
				}
				return tool;
			})
		);

		return tools;
	}

	async updateExternalTool(toUpdate: ExternalToolDO): Promise<ExternalToolDO> {
		// TODO move to private function
		if (toUpdate.config instanceof Oauth2ToolConfigDO) {
			const toUpdateOauthClient: ProviderOauthClient = this.mapper.mapDoToProviderOauthClient(
				toUpdate.name,
				toUpdate.config
			);
			const loadedOauthClient: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(
				toUpdate.config.clientId
			);
			if (loadedOauthClient && loadedOauthClient.client_id) {
				await this.oauthProviderService.updateOAuth2Client(loadedOauthClient.client_id, toUpdateOauthClient);
			} else {
				throw new UnprocessableEntityException(
					`The oAuthConfigs clientId "${toUpdate.config.clientId}" does not exist`
				);
			}
		}
		toUpdate.version += 1;
		const externalTool: ExternalToolDO = await this.externalToolRepo.save(toUpdate);
		return externalTool;
	}

	async findExternalToolById(id: string): Promise<ExternalToolDO> {
		const externalTool: ExternalToolDO = await this.externalToolRepo.findById(id);
		return externalTool;
	}

	async isNameUnique(externalToolDO: ExternalToolDO): Promise<boolean> {
		const duplicate: ExternalToolDO | null = await this.externalToolRepo.findByName(externalToolDO.name);
		return duplicate == null;
	}

	async isClientIdUnique(oauth2ToolConfig: Oauth2ToolConfigDO): Promise<boolean> {
		const duplicate: ExternalToolDO | null = await this.externalToolRepo.findByOAuth2ConfigClientId(
			oauth2ToolConfig.clientId
		);

		return duplicate == null;
	}

	// TODO move to validationService
	hasDuplicateAttributes(customParameter: CustomParameterDO[]): boolean {
		return customParameter.some((item, itemIndex) => {
			return customParameter.some((other, otherIndex) => itemIndex !== otherIndex && item.name === other.name);
		});
	}

	validateByRegex(customParameter: CustomParameterDO[]): boolean {
		return customParameter.every((param: CustomParameterDO) => {
			if (param.regex) {
				try {
					// eslint-disable-next-line no-new
					new RegExp(param.regex);
				} catch (e) {
					return false;
				}
			}
			return true;
		});
	}

	applyProviderOauthClientToDO(oauth2Config: Oauth2ToolConfigDO, oauthClient: ProviderOauthClient): void {
		oauth2Config.scope = oauthClient.scope;
		oauth2Config.tokenEndpointAuthMethod = oauthClient.token_endpoint_auth_method as TokenEndpointAuthMethod;
		oauth2Config.redirectUris = oauthClient.redirect_uris;
		oauth2Config.frontchannelLogoutUri = oauthClient.frontchannel_logout_uri;
	}
}
