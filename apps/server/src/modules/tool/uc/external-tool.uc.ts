import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ICurrentUser, Permission, User } from '@shared/domain';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { ExternalToolDO, Oauth2ToolConfigDO, Lti11ToolConfigDO } from '@shared/domain/domainobject/external-tool.do';
import { ExternalToolMapper } from '@src/modules/tool/mapper/external-tool-do.mapper';
import { AuthorizationService } from '@src/modules/authorization';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolMapper: ExternalToolMapper,
		private readonly authorizationService: AuthorizationService,
		private readonly oauthProviderService: OauthProviderService
	) {}

	async createExternalTool(externalToolDO: ExternalToolDO, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_CREATE]);

		if (!this.externalToolService.isNameUnique(externalToolDO)) {
			throw new UnprocessableEntityException(`The toolname ${externalToolDO.name} is already used`);
		}
		if (this.externalToolService.hasDuplicateAttributes(externalToolDO.parameters)) {
			throw new UnprocessableEntityException(`...`);
		}

		let created: ExternalToolDO;
		if (externalToolDO.config instanceof Oauth2ToolConfigDO) {
			if (!this.externalToolService.isClientIdUnique(externalToolDO)) {
				throw new UnprocessableEntityException(`The Client Id of the tool: ${externalToolDO.name} is already used`);
			}

			const oauthClient: ProviderOauthClient = this.externalToolMapper.mapDoToProviderOauthClient(
				externalToolDO.name,
				externalToolDO.config
			);
			const createdOauthClient = await this.oauthProviderService.createOAuth2Client(oauthClient);

			this.externalToolService.encryptSecrets(externalToolDO);
			created = await this.externalToolService.createExternalTool(externalToolDO);

			created.config = this.externalToolMapper.applyProviderOauthClientToDO(
				created.config as Oauth2ToolConfigDO,
				createdOauthClient
			);
		} else {
			this.externalToolService.encryptSecrets(externalToolDO);
			created = await this.externalToolService.createExternalTool(externalToolDO);
		}

		return created;
	}
}
