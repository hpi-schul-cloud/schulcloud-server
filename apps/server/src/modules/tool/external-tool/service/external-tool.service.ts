import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, IFindOptions, Page } from '@shared/domain';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { ExternalToolSearchQuery } from '../../common/interface';
import { ExternalToolVersionService } from './external-tool-version.service';
import { ExternalToolServiceMapper } from './external-tool-service.mapper';
import { ExternalTool, Oauth2ToolConfigDO } from '../domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { CustomParameterScope, TokenEndpointAuthMethod } from '../../common/enum';
import { CustomParameterDO } from '../../common/domain';

@Injectable()
export class ExternalToolService {
	constructor(
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly oauthProviderService: OauthProviderService,
		private readonly mapper: ExternalToolServiceMapper,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		@Inject(DefaultEncryptionService) private readonly encryptionService: IEncryptionService,
		private readonly logger: LegacyLogger,
		private readonly externalToolVersionService: ExternalToolVersionService
	) {}

	async createExternalTool(externalToolDO: ExternalTool): Promise<ExternalTool> {
		if (ExternalTool.isLti11Config(externalToolDO.config) && externalToolDO.config.secret) {
			externalToolDO.config.secret = this.encryptionService.encrypt(externalToolDO.config.secret);
		} else if (ExternalTool.isOauth2Config(externalToolDO.config)) {
			const oauthClient: ProviderOauthClient = this.mapper.mapDoToProviderOauthClient(
				externalToolDO.name,
				externalToolDO.config
			);

			await this.oauthProviderService.createOAuth2Client(oauthClient);
		}

		const created: ExternalTool = await this.externalToolRepo.save(externalToolDO);
		return created;
	}

	async updateExternalTool(toUpdate: ExternalTool, loadedTool: ExternalTool): Promise<ExternalTool> {
		await this.updateOauth2ToolConfig(toUpdate);
		this.externalToolVersionService.increaseVersionOfNewToolIfNecessary(loadedTool, toUpdate);
		const externalToolDO: ExternalTool = await this.externalToolRepo.save(toUpdate);
		return externalToolDO;
	}

	async findExternalTools(
		query: ExternalToolSearchQuery,
		options?: IFindOptions<ExternalTool>
	): Promise<Page<ExternalTool>> {
		const tools: Page<ExternalTool> = await this.externalToolRepo.find(query, options);

		const resolvedTools: (ExternalTool | undefined)[] = await Promise.all(
			tools.data.map(async (tool: ExternalTool): Promise<ExternalTool | undefined> => {
				if (ExternalTool.isOauth2Config(tool.config)) {
					try {
						await this.addExternalOauth2DataToConfig(tool.config);
					} catch (e) {
						this.logger.debug(
							`Could not resolve oauth2Config of tool with clientId ${tool.config.clientId}. It will be filtered out.`
						);
						return undefined;
					}
				}
				return tool;
			})
		);

		tools.data = resolvedTools.filter((tool) => tool !== undefined) as ExternalTool[];

		return tools;
	}

	async findExternalToolById(id: EntityId): Promise<ExternalTool> {
		const tool: ExternalTool = await this.externalToolRepo.findById(id);
		if (ExternalTool.isOauth2Config(tool.config)) {
			try {
				await this.addExternalOauth2DataToConfig(tool.config);
			} catch (e) {
				this.logger.debug(
					`Could not resolve oauth2Config of tool with clientId ${tool.config.clientId}. It will be filtered out.`
				);
				throw new UnprocessableEntityException(`Could not resolve oauth2Config of tool ${tool.name}.`);
			}
		}
		return tool;
	}

	findExternalToolByName(name: string): Promise<ExternalTool | null> {
		const externalToolDO: Promise<ExternalTool | null> = this.externalToolRepo.findByName(name);
		return externalToolDO;
	}

	findExternalToolByOAuth2ConfigClientId(clientId: string): Promise<ExternalTool | null> {
		const externalToolDO: Promise<ExternalTool | null> = this.externalToolRepo.findByOAuth2ConfigClientId(clientId);
		return externalToolDO;
	}

	async deleteExternalTool(toolId: EntityId): Promise<void> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolRepo.findByExternalToolId(toolId);
		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalToolDO: SchoolExternalTool): string =>
				// We can be sure that the repo returns the id
				schoolExternalToolDO.id as string
		);

		await Promise.all([
			this.contextExternalToolRepo.deleteBySchoolExternalToolIds(schoolExternalToolIds),
			this.schoolExternalToolRepo.deleteByExternalToolId(toolId),
			this.externalToolRepo.deleteById(toolId),
		]);
	}

	async getExternalToolForScope(externalToolId: EntityId, scope: CustomParameterScope): Promise<ExternalTool> {
		const externalToolDO: ExternalTool = await this.externalToolRepo.findById(externalToolId);
		if (externalToolDO.parameters) {
			externalToolDO.parameters = externalToolDO.parameters.filter(
				(parameter: CustomParameterDO) => parameter.scope === scope
			);
		}
		return externalToolDO;
	}

	private async updateOauth2ToolConfig(toUpdate: ExternalTool) {
		if (ExternalTool.isOauth2Config(toUpdate.config)) {
			const toUpdateOauthClient: ProviderOauthClient = this.mapper.mapDoToProviderOauthClient(
				toUpdate.name,
				toUpdate.config
			);
			const loadedOauthClient: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(
				toUpdate.config.clientId
			);
			await this.updateOauthClientOrThrow(loadedOauthClient, toUpdateOauthClient, toUpdate);
		}
	}

	private async updateOauthClientOrThrow(
		loadedOauthClient: ProviderOauthClient,
		toUpdateOauthClient: ProviderOauthClient,
		toUpdate: ExternalTool
	) {
		if (loadedOauthClient && loadedOauthClient.client_id) {
			await this.oauthProviderService.updateOAuth2Client(loadedOauthClient.client_id, toUpdateOauthClient);
		} else {
			throw new UnprocessableEntityException(`The oAuthConfigs clientId of tool ${toUpdate.name}" does not exist`);
		}
	}

	private async addExternalOauth2DataToConfig(config: Oauth2ToolConfigDO) {
		const oauthClient: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(config.clientId);

		config.scope = oauthClient.scope;
		config.tokenEndpointAuthMethod = oauthClient.token_endpoint_auth_method as TokenEndpointAuthMethod;
		config.redirectUris = oauthClient.redirect_uris;
		config.frontchannelLogoutUri = oauthClient.frontchannel_logout_uri;
	}
}
