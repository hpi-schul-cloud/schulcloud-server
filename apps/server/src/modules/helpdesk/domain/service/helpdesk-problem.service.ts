import { Configuration } from '@hpi-schul-cloud/commons';
import { AppendedAttachment, Mail, MailService } from '@infra/mail';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SupportType } from '../type';

export interface CreateHelpdeskProblemProps {
	supportType: SupportType;
	subject: string;
	description: string;
	replyEmail: string;
	notes?: string;
	files?: Express.Multer.File[];
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
	userId: EntityId;
	schoolId: EntityId;
}

@Injectable()
export class HelpdeskProblemService {
	constructor(private readonly emailService: MailService) {}

	public async createProblem(props: CreateHelpdeskProblemProps): Promise<void> {
		const attachments = props.files ? this.getAttachments(props.files) : undefined;

		const email: Mail = {
			recipients: this.getEmailAddresses(props.supportType),
			mail: {
				subject: `[Helpdesk][${props.supportType}] ${props.subject}`,
				plainTextContent: this.createFeedbackText('User', props),
				attachments,
			},
			replyTo: [props.replyEmail],
		};

		await this.emailService.send(email);
	}

	private getAttachments(files: Express.Multer.File[]): AppendedAttachment[] {
		const attachments = files.map(({ buffer, originalname, mimetype }) => {
			return {
				mimeType: mimetype,
				name: originalname,
				base64Content: buffer.toString('base64'),
				contentDisposition: 'ATTACHMENT' as const,
			};
		});

		return attachments;
	}

	public async createWish(props: CreateHelpdeskProblemProps): Promise<void> {
		//await this.sendEmails(props);
		throw new Error('Method not implemented.');
	}

	private async sendEmails(email: Mail): Promise<void> {
		// Send to support email addresses
		//const feedbackText = this.helpdeskProblemService.createFeedbackText(username, data);
		//const emails = this.helpdeskProblemService.getEmailAddresses(data.supportType);
		await this.emailService.send(email);
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
Problembeschreibung: ${data.description}
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
