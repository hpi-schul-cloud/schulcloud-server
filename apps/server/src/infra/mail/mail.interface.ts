/* istanbul ignore file */
export interface MailAttachment {
	base64Content: string;

	mimeType: string;

	name: string;
}

export interface InlineAttachment extends MailAttachment {
	contentDisposition: 'INLINE';

	contentId: string;
}

export interface AppendedAttachment extends MailAttachment {
	contentDisposition: 'ATTACHMENT';
}

export interface MailContent {
	subject: string;

	attachments?: (InlineAttachment | AppendedAttachment)[];
}

export interface PlainTextMailContent extends MailContent {
	htmlContent?: string;

	plainTextContent: string;
}

interface HtmlMailContent extends MailContent {
	htmlContent: string;

	plainTextContent?: string;
}

export interface Mail {
	mail: PlainTextMailContent | HtmlMailContent;

	recipients: string[];

	from: string;

	cc?: string[];

	bcc?: string[];

	replyTo?: string[];
}
