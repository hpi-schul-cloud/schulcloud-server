import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ICurrentUser, Permission, User } from '@shared/domain';
import { ExternalToolDO, Lti11ToolConfigDO, Oauth2ToolConfigDO } from '@shared/domain/domainobject/external-tool';
import { AuthorizationService } from '@src/modules/authorization';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { ExternalToolService } from '../service/external-tool.service';
import { ExternalToolRequestMapper } from '../mapper/external-tool-request.mapper';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolMapper: ExternalToolRequestMapper,
		private readonly authorizationService: AuthorizationService,
		private readonly oauthProviderService: OauthProviderService,
		@Inject(DefaultEncryptionService) private readonly oAuthEncryptionService: IEncryptionService
	) {}

	async createExternalTool(externalToolDO: ExternalToolDO, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);

		await this.checkValidation(externalToolDO);

		if (externalToolDO.config instanceof Lti11ToolConfigDO) {
			externalToolDO.config.secret = this.oAuthEncryptionService.encrypt(externalToolDO.config.secret);
		}

		let created: ExternalToolDO;
		if (externalToolDO.config instanceof Oauth2ToolConfigDO) {
			const oauthClient: ProviderOauthClient = this.externalToolMapper.mapDoToProviderOauthClient(
				externalToolDO.name,
				externalToolDO.config
			);
			const createdOauthClient = await this.oauthProviderService.createOAuth2Client(oauthClient);

			created = await this.externalToolService.createExternalTool(externalToolDO);

			created.config = this.externalToolMapper.applyProviderOauthClientToDO(
				created.config as Oauth2ToolConfigDO,
				createdOauthClient
			);
		} else {
			created = await this.externalToolService.createExternalTool(externalToolDO);
		}

		return created;
	}

	async updateExternalTool(
		toolId: string,
		externalToolDO: ExternalToolDO,
		currentUser: ICurrentUser
	): Promise<ExternalToolDO> {
		// TODO: get, increase version, override obj expect undefined, save
		// TODO: clientId immutable because of hydra secret
		await this.externalToolService.createExternalTool(externalToolDO);
		return {} as ExternalToolDO;
	}

	private async checkValidation(externalToolDO: ExternalToolDO) {
		if (!(await this.externalToolService.isNameUnique(externalToolDO))) {
			throw new UnprocessableEntityException(`The tool name "${externalToolDO.name}" is already used`);
		}
		if (externalToolDO.parameters && this.externalToolService.hasDuplicateAttributes(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`The tool: ${externalToolDO.name} contains multiple of the same custom parameters`
			);
		}
		if (externalToolDO.parameters && !this.externalToolService.validateByRegex(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(
				`A custom Parameter of the tool: ${externalToolDO.name} has wrong regex attribute.`
			);
		}

		if (
			externalToolDO.config instanceof Oauth2ToolConfigDO &&
			!(await this.externalToolService.isClientIdUnique(externalToolDO.config))
		) {
			throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`);
		}
	}
}
