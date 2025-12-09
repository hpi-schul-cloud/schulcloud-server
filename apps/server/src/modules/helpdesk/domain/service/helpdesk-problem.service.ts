import { Configuration } from '@hpi-schul-cloud/commons';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { HelpdeskProblem } from '../do';
import { HELPDESK_PROBLEM_REPO, HelpdeskProblemRepo } from '../interface';
import { HelpdeskProblemState, HelpdeskProblemType, SupportType } from '../type';

export interface CreateHelpdeskProblemProps {
	subject: string;
	schoolId: EntityId;
	userId?: EntityId;
	notes?: string;
	type?: HelpdeskProblemType;
	supportType?: SupportType;
	replyEmail?: string;
	problemDescription?: string;
	title?: string;
	files?: unknown[];
	device?: string;
	deviceUserAgent?: string;
	browserName?: string;
	browserVersion?: string;
	os?: string;
	problemArea?: string;
	role?: string;
	desire?: string;
	benefit?: string;
	acceptanceCriteria?: string;
	cloud?: string;
	schoolName?: string;
	systemInformation?: string;
}

@Injectable()
export class HelpdeskProblemService {
	constructor(@Inject(HELPDESK_PROBLEM_REPO) private readonly helpdeskProblemRepo: HelpdeskProblemRepo) {}

	async findById(id: EntityId): Promise<HelpdeskProblem> {
		return this.helpdeskProblemRepo.findById(id);
	}

	async findBySchoolId(schoolId: EntityId, options?: { limit?: number; skip?: number }): Promise<HelpdeskProblem[]> {
		return this.helpdeskProblemRepo.findBySchoolId(schoolId, options);
	}

	async create(props: CreateHelpdeskProblemProps): Promise<HelpdeskProblem> {
		const problem = new HelpdeskProblem({
			subject: props.subject,
			schoolId: props.schoolId,
			userId: props.userId,
			state: HelpdeskProblemState.OPEN,
			notes: props.notes,
			order: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			...props,
		});

		// Don't save to database if type is contactHPI (as in original hooks)
		if (props.type === HelpdeskProblemType.CONTACT_HPI) {
			return problem;
		}

		return this.helpdeskProblemRepo.save(problem);
	}

	async update(id: EntityId, updates: Partial<HelpdeskProblem>): Promise<HelpdeskProblem> {
		const problem = await this.helpdeskProblemRepo.findById(id);

		if (updates.subject !== undefined) {
			problem.subject = updates.subject;
		}
		if (updates.state !== undefined) {
			problem.updateState(updates.state);
		}
		if (updates.notes !== undefined) {
			problem.notes = updates.notes;
		}

		return this.helpdeskProblemRepo.save(problem);
	}

	async delete(id: EntityId): Promise<void> {
		return this.helpdeskProblemRepo.delete(id);
	}

	public createInfoText(username: string, data: CreateHelpdeskProblemProps): string {
		return `
Ein neues Problem wurde gemeldet.
User: ${username}
Betreff: ${data.subject}
Schaue für weitere Details und zur Bearbeitung bitte in den Helpdesk-Bereich der ${data.cloud}.

Mit freundlichen Grüßen
Deine ${data.cloud}
		`;
	}

	public createFeedbackText(username: string, data: CreateHelpdeskProblemProps): string {
		const device = data.deviceUserAgent ? `${data.device} [auto-detection: ${data.deviceUserAgent}]` : data.device;
		let text = `
SystemInformation: ${data.systemInformation}
ReplyEmail: ${data.replyEmail}
User: ${username}
User-ID: ${data.userId}
Schule: ${data.schoolName}
Schule-ID: ${data.schoolId}
Instanz: ${data.cloud}
Browser: ${data.browserName}
Browser Version: ${data.browserVersion}
Betriebssystem: ${data.os}
Gerät: ${device}
Problembereich: ${data.problemArea}
`;

		if (data.desire && data.desire !== '') {
			text = `
${text}
User schrieb folgendes:
Als ${data.role}
möchte ich ${data.desire},
um ${data.benefit}.
Akzeptanzkriterien: ${data.acceptanceCriteria}
`;
		} else {
			text = `
${text}
User meldet folgendes:
Problem Kurzbeschreibung: ${data.subject}
Problembeschreibung: ${data.problemDescription}
`;
			if (data.notes) {
				text = `
${text}
Anmerkungen: ${data.notes}
`;
			}
		}
		return text;
	}

	public getEmailAddresses(supportType?: SupportType): string[] {
		const emails: string[] = [];
		if (supportType) {
			if (supportType === SupportType.PROBLEM) {
				emails.push(Configuration.get('SUPPORT_PROBLEM_EMAIL_ADDRESS'));
			} else {
				const wishEmails = Configuration.get('SUPPORT_WISH_EMAIL_ADDRESS')
					.split(',')
					.map((mail: string) => mail.trim());
				wishEmails.forEach((mail: string) => emails.push(mail));
			}
		} else {
			emails.push(Configuration.get('SUPPORT_PROBLEM_EMAIL_ADDRESS'));
		}
		return emails;
	}
}
