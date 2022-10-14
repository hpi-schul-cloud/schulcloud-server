import { LtiToolRepo } from '@shared/repo';
import { NotImplementedException } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ICurrentUser, Permission, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules';

export class LtiToolUc {
	constructor(private readonly ltiToolRepo: LtiToolRepo, private readonly authorizationService: AuthorizationService) {}

	async findLtiTool(currentUser: ICurrentUser): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_VIEW]);

		throw new NotImplementedException();
	}

	async getLtiTool(currentUser: ICurrentUser, toolId: string): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_VIEW]);

		const tool: Promise<LtiToolDO> = this.ltiToolRepo.findById(toolId);
		return tool;
	}

	async createLtiTool(currentUser: ICurrentUser, tool: LtiToolDO): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_CREATE]);

		const savedTool: Promise<LtiToolDO> = this.ltiToolRepo.save(tool);
		return savedTool;
	}

	async updateLtiTool(currentUser: ICurrentUser, tool: Partial<LtiToolDO>): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_EDIT]);

		throw new NotImplementedException();
	}

	async deleteLtiTool(currentUser: ICurrentUser, toolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_EDIT]);

		const promise: Promise<void> = this.ltiToolRepo.deleteById(toolId);
		return promise;
	}
}
