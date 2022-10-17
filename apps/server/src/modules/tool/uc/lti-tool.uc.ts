import { LtiToolRepo } from '@shared/repo';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { ICurrentUser, IFindOptions, Page, Permission, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LtiToolUc {
	constructor(private readonly ltiToolRepo: LtiToolRepo, private readonly authorizationService: AuthorizationService) {}

	async findLtiTool(
		currentUser: ICurrentUser,
		query: Partial<LtiToolDO>,
		options: IFindOptions<LtiToolDO>
	): Promise<Page<LtiToolDO>> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_VIEW]);

		const tool: Promise<Page<LtiToolDO>> = this.ltiToolRepo.find(query, options);
		return tool;
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

	async updateLtiTool(currentUser: ICurrentUser, toolId: string, tool: Partial<LtiToolDO>): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_EDIT]);

		// TODO: extract patching to anywhere else?
		const toolFromDb: LtiToolDO = await this.ltiToolRepo.findById(toolId);
		let updatedTool: LtiToolDO = Object.assign(toolFromDb, tool);
		updatedTool = await this.ltiToolRepo.save(updatedTool);

		return updatedTool;
	}

	async deleteLtiTool(currentUser: ICurrentUser, toolId: string): Promise<void> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_EDIT]);

		const promise: Promise<void> = this.ltiToolRepo.deleteById(toolId);
		return promise;
	}
}
