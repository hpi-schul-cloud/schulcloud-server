import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import type { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ExternalTool, ExternalToolService } from '../../external-tool';
import { ExternalToolUtilization } from '../domain';
import { ExternalToolUtilizationService } from '../service';

@Injectable()
export class ExternalToolUtilizationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly commonToolUtilizationService: ExternalToolUtilizationService
	) {}

	public async getUtilizationForExternalTool(userId: EntityId, toolId: EntityId): Promise<ExternalToolUtilization> {
		const externalTool: ExternalTool = await this.externalToolService.findById(toolId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(
			user,
			externalTool,
			AuthorizationContextBuilder.read([Permission.TOOL_ADMIN])
		);

		const metadata: ExternalToolUtilization = await this.commonToolUtilizationService.getUtilizationForExternalTool(
			toolId
		);

		return metadata;
	}
}
