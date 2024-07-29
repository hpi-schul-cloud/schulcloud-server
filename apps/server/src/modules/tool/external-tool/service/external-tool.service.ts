import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { ProviderOauthClient } from '@modules/oauth-provider/domain';
import { OauthProviderService } from '@modules/oauth-provider/domain/service/oauth-provider.service';
import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolRepo, ExternalToolRepo, SchoolExternalToolRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { TokenEndpointAuthMethod } from '../../common/enum';
import { ExternalToolSearchQuery } from '../../common/interface';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ExternalTool, Oauth2ToolConfig } from '../domain';
import { ExternalToolServiceMapper } from './external-tool-service.mapper';

@Injectable()
export class ExternalToolService {
	constructor(
		private readonly externalToolRepo: ExternalToolRepo,
		private readonly oauthProviderService: OauthProviderService,
		private readonly mapper: ExternalToolServiceMapper,
		private readonly schoolExternalToolRepo: SchoolExternalToolRepo,
		private readonly contextExternalToolRepo: ContextExternalToolRepo,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService,
		private readonly legacyLogger: LegacyLogger
	) {}

	public async createExternalTool(externalTool: ExternalTool): Promise<ExternalTool> {
		if (ExternalTool.isLti11Config(externalTool.config) && externalTool.config.secret) {
			externalTool.config.secret = this.encryptionService.encrypt(externalTool.config.secret);
		} else if (ExternalTool.isOauth2Config(externalTool.config)) {
			const oauthClient: Partial<ProviderOauthClient> = this.mapper.mapDoToProviderOauthClient(
				externalTool.name,
				externalTool.config
			);

			await this.oauthProviderService.createOAuth2Client(oauthClient);
		}

		const created: ExternalTool = await this.externalToolRepo.save(externalTool);

		return created;
	}

	public async updateExternalTool(toUpdate: ExternalTool): Promise<ExternalTool> {
		// TODO N21-2097 use encryption for secret
		await this.updateOauth2ToolConfig(toUpdate);

		const externalTool: ExternalTool = await this.externalToolRepo.save(toUpdate);

		return externalTool;
	}

	public async findExternalTools(
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
						this.legacyLogger.debug(
							`Could not resolve oauth2Config of tool with clientId ${tool.config.clientId}. It will be filtered out.`
						);
						return undefined;
					}
				}
				return tool;
			})
		);

		tools.data = resolvedTools.filter((tool) => tool !== undefined);

		return tools;
	}

	public async findById(id: EntityId): Promise<ExternalTool> {
		const tool: ExternalTool = await this.externalToolRepo.findById(id);
		if (ExternalTool.isOauth2Config(tool.config)) {
			try {
				await this.addExternalOauth2DataToConfig(tool.config);
			} catch (e) {
				this.legacyLogger.debug(
					`Could not resolve oauth2Config of tool with clientId ${tool.config.clientId}. It will be filtered out.`
				);
				throw new UnprocessableEntityException(`Could not resolve oauth2Config of tool ${tool.name}.`);
			}
		}
		return tool;
	}

	public findExternalToolByName(name: string): Promise<ExternalTool | null> {
		const externalTool: Promise<ExternalTool | null> = this.externalToolRepo.findByName(name);
		return externalTool;
	}

	public findExternalToolByOAuth2ConfigClientId(clientId: string): Promise<ExternalTool | null> {
		const externalTool: Promise<ExternalTool | null> = this.externalToolRepo.findByOAuth2ConfigClientId(clientId);
		return externalTool;
	}

	public findExternalToolByMedium(mediumId: string, mediaSourceId?: string): Promise<ExternalTool | null> {
		const externalTool: Promise<ExternalTool | null> = this.externalToolRepo.findByMedium(mediumId, mediaSourceId);
		return externalTool;
	}

	public async deleteExternalTool(toolId: EntityId): Promise<void> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolRepo.findByExternalToolId(toolId);
		const schoolExternalToolIds: string[] = schoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool): string => schoolExternalTool.id
		);

		await Promise.all([
			this.contextExternalToolRepo.deleteBySchoolExternalToolIds(schoolExternalToolIds),
			this.schoolExternalToolRepo.deleteByExternalToolId(toolId),
			this.externalToolRepo.deleteById(toolId),
		]);
	}

	private async updateOauth2ToolConfig(toUpdate: ExternalTool) {
		if (ExternalTool.isOauth2Config(toUpdate.config)) {
			const toUpdateOauthClient: Partial<ProviderOauthClient> = this.mapper.mapDoToProviderOauthClient(
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
		toUpdateOauthClient: Partial<ProviderOauthClient>,
		toUpdate: ExternalTool
	) {
		if (loadedOauthClient && loadedOauthClient.client_id) {
			await this.oauthProviderService.updateOAuth2Client(loadedOauthClient.client_id, toUpdateOauthClient);
		} else {
			throw new UnprocessableEntityException(`The oAuthConfigs clientId of tool ${toUpdate.name}" does not exist`);
		}
	}

	private async addExternalOauth2DataToConfig(config: Oauth2ToolConfig) {
		const oauthClient: ProviderOauthClient = await this.oauthProviderService.getOAuth2Client(config.clientId);

		config.scope = oauthClient.scope;
		config.tokenEndpointAuthMethod = oauthClient.token_endpoint_auth_method as TokenEndpointAuthMethod;
		config.redirectUris = oauthClient.redirect_uris;
		config.frontchannelLogoutUri = oauthClient.frontchannel_logout_uri;
	}
}
