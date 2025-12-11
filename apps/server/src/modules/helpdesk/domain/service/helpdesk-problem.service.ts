import { Logger } from '@core/logger';
import { AppendedAttachment, Mail, MailService } from '@infra/mail';
import { Inject, Injectable } from '@nestjs/common';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from '../../helpdesk-config';
import { HelpdeskDeviceProps, HelpdeskProblemProps, HelpdeskSystemProps, HelpdeskWishProps } from '../interface';
import { SendEmailLoggable } from '../loggable';
import { TextMapper } from '../mapper';

@Injectable()
export class HelpdeskProblemService {
	constructor(
		private readonly emailService: MailService,
		@Inject(HELPDESK_CONFIG_TOKEN) private readonly config: HelpdeskConfig,
		private readonly logger: Logger
	) {}

	public async createProblem(
		problemProps: HelpdeskProblemProps,
		systemProps: HelpdeskSystemProps,
		deviceProps?: HelpdeskDeviceProps,
		files?: Express.Multer.File[]
	): Promise<void> {
		const plainTextContent = TextMapper.createFeedbackText(problemProps, systemProps, deviceProps);
		await this.sendEmail(
			[this.config.problemEmailAddress],
			problemProps.replyEmail,
			problemProps.subject,
			plainTextContent,
			files
		);
	}

	public async createWish(
		props: HelpdeskWishProps,
		systemProps: HelpdeskSystemProps,
		deviceProps?: HelpdeskDeviceProps,
		files?: Express.Multer.File[]
	): Promise<void> {
		const plainTextContent = TextMapper.createWishText(props, systemProps, deviceProps);
		await this.sendEmail([this.config.wishEmailAddress], props.replyEmail, props.subject, plainTextContent, files);
	}

	private async sendEmail(
		recipients: string[],
		replyTo: string,
		subject: string,
		plainTextContent: string,
		files?: Express.Multer.File[]
	): Promise<void> {
		const attachments = files ? this.getAttachments(files) : undefined;
		const email: Mail = {
			recipients,
			mail: {
				subject,
				plainTextContent,
				attachments,
			},
			replyTo: [replyTo],
		};
		if (this.config.forceSendEmails) {
			await this.emailService.send(email);
		} else {
			this.logger.debug(new SendEmailLoggable(recipients, replyTo, subject, plainTextContent, !!attachments));
		}
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
}
