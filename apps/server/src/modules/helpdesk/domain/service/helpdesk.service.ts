import { Logger } from '@core/logger';
import { AppendedAttachment, Mail, MailService } from '@infra/mail';
import { Inject, Injectable } from '@nestjs/common';
import { HELPDESK_CONFIG_TOKEN, HelpdeskConfig } from '../../helpdesk-config';
import { HelpdeskProblemProps, HelpdeskWishProps, UserContextProps, UserDeviceProps } from '../interface';
import { TextFormatter } from './text-formatter.helper';

@Injectable()
export class HelpdeskService {
	constructor(
		private readonly emailService: MailService,
		@Inject(HELPDESK_CONFIG_TOKEN) private readonly config: HelpdeskConfig,
		private readonly logger: Logger
	) {
		this.logger.setContext(HelpdeskService.name);
	}

	public async createProblem(
		problem: HelpdeskProblemProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps,
		files?: Express.Multer.File[]
	): Promise<void> {
		const plainTextContent = TextFormatter.createProblemText(problem, userContext, userDevice);
		await this.userSendEmailToSupport(
			[this.config.problemEmailAddress],
			problem.replyEmail,
			problem.subject,
			plainTextContent,
			files
		);
	}

	public async createWish(
		wish: HelpdeskWishProps,
		userContext: UserContextProps,
		userDevice?: UserDeviceProps,
		files?: Express.Multer.File[]
	): Promise<void> {
		const plainTextContent = TextFormatter.createWishText(wish, userContext, userDevice);
		await this.userSendEmailToSupport(
			[this.config.wishEmailAddress],
			wish.replyEmail,
			wish.subject,
			plainTextContent,
			files
		);
	}

	private async userSendEmailToSupport(
		recipients: string[],
		replyTo: string,
		subject: string,
		plainTextContent: string,
		files?: Express.Multer.File[]
	): Promise<void> {
		const attachments = files && files.length > 0 ? this.getAttachments(files) : undefined;
		const email: Mail = {
			recipients,
			mail: {
				subject,
				plainTextContent,
				attachments,
			},
			replyTo: [replyTo],
			from: this.config.fromEmailAddress,
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
}
