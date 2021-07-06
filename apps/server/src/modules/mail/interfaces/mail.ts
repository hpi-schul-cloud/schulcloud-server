interface MailAttachment {
	base64Content: string;

	mimeType: string;

	name: string;
}

interface InlineAttachment extends MailAttachment {
	contentDisposition: 'INLINE';

	contentId: string;
}

interface AppendedAttachment extends MailAttachment {
	contentDisposition: 'ATTACHMENT';
}

interface MailContent {
	subject: string;

	attachments?: (InlineAttachment | AppendedAttachment)[];
}

interface PlainTextMailContent extends MailContent {
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

	from?: string;

	cc?: string[];

	bcc?: string[];

	replyTo?: string[];
}
