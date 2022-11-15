import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ICurrentUser, Permission, User } from '@shared/domain';
import { ExternalToolService } from '@src/modules/tool/service/external-tool.service';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool.do';
import { ExternalToolMapper } from '@src/modules/tool/mapper/external-tool-do.mapper';
import { AuthorizationService } from '@src/modules/authorization';

@Injectable()
export class ExternalToolUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly externalToolMapper: ExternalToolMapper,
		private readonly authorizationService: AuthorizationService
	) {}

	async createExternalTool(externalToolDO: ExternalToolDO, currentUser: ICurrentUser): Promise<ExternalToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_CREATE]);
		if (!this.externalToolService.isNameUnique(externalToolDO)) {
			throw new UnprocessableEntityException(`The toolname ${externalToolDO.name} is already used`);
		}
		const created: ExternalToolDO = await this.externalToolService.createExternalTool(externalToolDO, currentUser);
		return created;
	}
}
