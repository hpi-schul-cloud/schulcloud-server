import { CourseRepo, LtiToolRepo } from '@shared/repo';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { Actions, Course, ICurrentUser, IFindOptions, Page, Permission, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { Injectable } from '@nestjs/common';
import { LtiToolService } from '@src/modules/tool/service/lti-tool.service';

@Injectable()
export class LtiToolUc {
	constructor(
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly courseRepo: CourseRepo,
		private readonly litToolService: LtiToolService
	) {}

	async findLtiTool(
		currentUser: ICurrentUser,
		query: Partial<LtiToolDO>,
		options: IFindOptions<LtiToolDO>
	): Promise<Page<LtiToolDO>> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_VIEW]);

		const tools: Page<LtiToolDO> = await this.ltiToolRepo.find(query, options);

		await this.litToolService.filterFindBBB(tools, currentUser.schoolId);

		return tools;
	}

	async getLtiTool(currentUser: ICurrentUser, toolId: string): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_VIEW]);

		const tool: LtiToolDO = await this.ltiToolRepo.findById(toolId);

		await this.litToolService.filterGetBBB(tool, currentUser.schoolId);

		return tool;
	}

	async createLtiTool(currentUser: ICurrentUser, tool: LtiToolDO, courseId?: string): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);

		if (courseId) {
			await this.checkCoursePermission(user, courseId);

			this.litToolService.setupBBB(tool, courseId);
		} else {
			this.authorizationService.checkAllPermissions(user, [Permission.TOOL_CREATE, Permission.TOOL_ADMIN]);
		}

		await this.litToolService.addSecret(tool);

		const savedTool: Promise<LtiToolDO> = this.ltiToolRepo.save(tool);
		return savedTool;
	}

	private async checkCoursePermission(user: User, courseId: string): Promise<void> {
		const course: Course = await this.courseRepo.findById(courseId);
		this.authorizationService.checkPermission(user, course, {
			action: Actions.write,
			requiredPermissions: [Permission.TOOL_CREATE],
		});
	}

	async updateLtiTool(currentUser: ICurrentUser, toolId: string, tool: Partial<LtiToolDO>): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_EDIT]);

		const toolFromDb: LtiToolDO = await this.ltiToolRepo.findById(toolId);
		let updatedTool: LtiToolDO = Object.assign(toolFromDb, tool);
		updatedTool = await this.ltiToolRepo.save(updatedTool);

		return updatedTool;
	}

	async deleteLtiTool(currentUser: ICurrentUser, toolId: string): Promise<LtiToolDO> {
		const user: User = await this.authorizationService.getUserWithPermissions(currentUser.userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_EDIT]);

		// TODO: N21-301 feathers returns the deleted object and the superhero dashboard relies on this, remove after new tool implementation
		const tool: LtiToolDO = await this.ltiToolRepo.findById(toolId);
		await this.ltiToolRepo.deleteById(toolId);
		return tool;
	}
}
