import { AuthorizationService } from '@modules/authorization';
import { Permission, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { HelpdeskProblem } from '../domain/do';
import { CreateHelpdeskProblemProps, HelpdeskProblemService } from '../domain/service';
import { HelpdeskProblemType } from '../domain/type';
import { HelpdeskProblemResponse } from './dto';

@Injectable()
export class HelpdeskUc {
	constructor(
		private readonly helpdeskProblemService: HelpdeskProblemService,
		private readonly authorizationService: AuthorizationService,
		private readonly userService: UserService
	) {}

	async createHelpdeskProblem(
		userId: EntityId,
		schoolId: EntityId,
		username: string,
		data: CreateHelpdeskProblemProps
	): Promise<HelpdeskProblemResponse | void> {
		// Check permissions
		await this.authorizationService.checkPermission(userId, Permission.HELPDESK_CREATE);

		// Add user and school info
		const createProps: CreateHelpdeskProblemProps = {
			...data,
			userId,
			schoolId,
		};

		// Generate system information if needed
		if (data.type !== HelpdeskProblemType.CONTACT_ADMIN) {
			createProps.systemInformation = await this.generateSystemInformation(userId, username);
		}

		const problem = await this.helpdeskProblemService.create(createProps);

		// Send emails (similar to original hooks logic)
		await this.sendEmails(username, createProps);

		// Return response only if problem was saved to DB
		if (data.type !== HelpdeskProblemType.CONTACT_HPI) {
			return this.mapToResponse(problem);
		}
	}

	async findHelpdeskProblems(
		userId: EntityId,
		schoolId: EntityId,
		options?: { limit?: number; skip?: number }
	): Promise<HelpdeskProblemResponse[]> {
		// Check permissions
		await this.authorizationService.checkPermission(userId, Permission.HELPDESK_VIEW);

		const problems = await this.helpdeskProblemService.findBySchoolId(schoolId, options);
		return problems.map((problem) => this.mapToResponse(problem));
	}

	async getHelpdeskProblem(userId: EntityId, problemId: EntityId): Promise<HelpdeskProblemResponse> {
		// Check permissions
		await this.authorizationService.checkPermission(userId, Permission.HELPDESK_VIEW);

		const problem = await this.helpdeskProblemService.findById(problemId);

		// Check if user can access this problem (same school)
		await this.authorizationService.checkEntityPermissions(userId, problem, Permission.HELPDESK_VIEW);

		return this.mapToResponse(problem);
	}

	async updateHelpdeskProblem(
		userId: EntityId,
		problemId: EntityId,
		updates: Partial<HelpdeskProblem>
	): Promise<HelpdeskProblemResponse> {
		// Check permissions
		await this.authorizationService.checkPermission(userId, Permission.HELPDESK_EDIT);

		const problem = await this.helpdeskProblemService.findById(problemId);

		// Check if user can edit this problem (same school)
		await this.authorizationService.checkEntityPermissions(userId, problem, Permission.HELPDESK_EDIT);

		const updatedProblem = await this.helpdeskProblemService.update(problemId, updates);
		return this.mapToResponse(updatedProblem);
	}

	async deleteHelpdeskProblem(userId: EntityId, problemId: EntityId): Promise<void> {
		// Check permissions
		await this.authorizationService.checkPermission(userId, Permission.HELPDESK_CREATE);

		const problem = await this.helpdeskProblemService.findById(problemId);

		// Check if user can delete this problem (same school)
		await this.authorizationService.checkEntityPermissions(userId, problem, Permission.HELPDESK_CREATE);

		await this.helpdeskProblemService.delete(problemId);
	}

	private async generateSystemInformation(userId: EntityId, username: string): Promise<string> {
		const user = await this.userService.findById(userId);
		const roles = user.roles?.map((role) => role.name) || ['NO ROLE(S)'];
		const email = user.email || 'NO EMAIL';

		return `
	User login: ${username}
	User role(s): ${roles}
	User registrated email: ${email}
		`;
	}

	private async sendEmails(username: string, data: CreateHelpdeskProblemProps): Promise<void> {
		// TODO: Implement email sending logic
		// This should integrate with the existing email service
		// Similar to the original globalHooks.sendEmail functionality

		if (data.type === HelpdeskProblemType.CONTACT_ADMIN) {
			// Send to admin/helpdesk roles
			const infoText = this.helpdeskProblemService.createInfoText(username, data);
			// await emailService.sendToRoles(['helpdesk', 'administrator'], {
			//   subject: 'Ein Problem wurde gemeldet.',
			//   content: infoText,
			//   attachments: data.files,
			// });
		} else {
			// Send to support email addresses
			const feedbackText = this.helpdeskProblemService.createFeedbackText(username, data);
			const emails = this.helpdeskProblemService.getEmailAddresses(data.supportType);
			// await emailService.send({
			//   emails,
			//   subject: data.title || data.subject || 'nosubject',
			//   replyEmail: data.replyEmail,
			//   content: feedbackText,
			//   attachments: data.files,
			// });
		}
	}

	private mapToResponse(problem: HelpdeskProblem): HelpdeskProblemResponse {
		return new HelpdeskProblemResponse({
			id: problem.id as string,
			subject: problem.subject,
			currentState: problem.props.currentState,
			targetState: problem.props.targetState,
			state: problem.state,
			notes: problem.notes,
			order: problem.props.order,
			userId: problem.userId,
			schoolId: problem.schoolId,
			forwardedAt: problem.props.forwardedAt,
			createdAt: problem.createdAt as Date,
			updatedAt: problem.updatedAt as Date,
		});
	}
}
