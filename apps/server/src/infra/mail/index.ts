/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { MAIL_CONFIG_TOKEN, MailConfig, MailExchange } from './mail.config';
export {
	AppendedAttachment,
	InlineAttachment,
	Mail,
	MailAttachment,
	MailContent,
	PlainTextMailContent,
} from './mail.interface';
export { MailModule } from './mail.module';
export { MailService } from './mail.service';
