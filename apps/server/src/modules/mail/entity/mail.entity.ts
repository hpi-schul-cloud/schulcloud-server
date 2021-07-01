import { ContentDisposition } from '../constants';

export abstract class MailAttachment {
    constructor(
        private base64Content: string,
        private mimeType: string,
        private name: string,
        private contentDisposition: ContentDisposition,
    ) {};

    static createInstance(base64Content: string, mimeType: string, name: string, contentDisposition: ContentDisposition, contentId?: string): MailAttachment {
        if (contentDisposition === ContentDisposition.Inline) {
            if (!contentId) {
                throw new Error('Test');
            }
            return new InlineAttachment(base64Content, mimeType, name, contentDisposition, contentId);
        } else {
            return new AppendedAttachment(base64Content, mimeType, name, contentDisposition);
        }
    }
}

class AppendedAttachment extends MailAttachment {}

class InlineAttachment extends MailAttachment {
    constructor(
        base64Content: string,
        mimeType: string,
        name: string,
        contentDisposition: ContentDisposition,
        private contentId: string,
    ) {
        super(base64Content, mimeType, name, contentDisposition);
    };
}


class MailContent {
    constructor(
        private subject: string,
        private attachments?: MailAttachment[],
        private htmlContent?: string,
        private plainTextContent?: string,
    ) {
        if (!htmlContent && !plainTextContent) {
            throw new Error('Test');
        }
    };
};

export class Mail {
    mail: MailContent;

    constructor(
        subject: string,
        private recipients: string[],
        attachments?: MailAttachment[],
        htmlContent?: string,
        plainTextContent?: string,
        private from?: string,
        private cc?: string[],
        private bcc?: string[],
        private replyTo?: string[],
    ) {
        this.mail = new MailContent(subject, attachments, htmlContent, plainTextContent);
    };

}
