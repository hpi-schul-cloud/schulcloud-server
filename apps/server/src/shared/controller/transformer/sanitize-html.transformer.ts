import { NotImplementedException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import sanitize, { AllowedAttribute } from 'sanitize-html';
import { InputFormat } from '@shared/domain';

export type IInputFormatsConfig = {
	allowedTags: string[]; // Note: tag names are not case-sensitive
	allowedAttributes?: Record<string, AllowedAttribute[]>;
};

const inputFormatsSanitizeConfig: Record<string, IInputFormatsConfig> = {
	PlainText: {
		allowedTags: [],
		allowedAttributes: {},
	},

	RichTextSimple: {
		allowedTags: ['b', 'i', 'em', 'strong', 'small', 's', 'u'],
		allowedAttributes: {},
	},

	RichText: {
		allowedTags: [
			'b',
			'i',
			'em',
			'strong',
			'small',
			's',
			'u',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'ul',
			'li',
			'ol',
			'dl',
			'dt',
			'dd',
			'p',
			'pre',
			'br',
			'hr',
			'table',
			'tbody',
			'td',
			'tfoot',
			'th',
			'thead',
			'tr',
			'tr',
			'td',
			'a',
			'img',
		],
		allowedAttributes: {
			a: ['href', 'name', 'target'],
			img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
		},
	},

	// TODO
	RichTextCk4: {
		allowedTags: [
			'b',
			'i',
			'em',
			'strong',
			'small',
			's',
			'u',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'ul',
			'li',
			'ol',
			'dl',
			'dt',
			'dd',
			'p',
			'pre',
			'br',
			'hr',
			'table',
			'tbody',
			'td',
			'tfoot',
			'th',
			'thead',
			'tr',
			'tr',
			'td',
			'a',
			'img',
		],
		allowedAttributes: {
			a: ['href', 'name', 'target'],
			img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
		},
	},

	// TODO
	RichTextCk5: {
		allowedTags: [
			'b',
			'i',
			'em',
			'strong',
			'small',
			's',
			'u',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'ul',
			'li',
			'ol',
			'dl',
			'dt',
			'dd',
			'p',
			'pre',
			'br',
			'hr',
			'table',
			'tbody',
			'td',
			'tfoot',
			'th',
			'thead',
			'tr',
			'tr',
			'td',
			'a',
			'img',
		],
		allowedAttributes: {
			a: ['href', 'name', 'target'],
			img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
		},
	},

	// TODO
	RichTextCk5Simple: {
		allowedTags: ['b', 'i', 'em', 'strong', 'small', 's', 'u'],
		allowedAttributes: {},
	},
};

export const getSanitizeHtmlOptions = (inputFormat?: InputFormat): IInputFormatsConfig => {
	switch (inputFormat) {
		case InputFormat.RICHTEXT_SIMPLE:
			return inputFormatsSanitizeConfig.RichTextSimple;
		case InputFormat.RICH_TEXT:
			return inputFormatsSanitizeConfig.RichText;
		case InputFormat.RICH_TEXT_CK4:
			return inputFormatsSanitizeConfig.RichTextCk4;
		case InputFormat.RICH_TEXT_CK5:
			return inputFormatsSanitizeConfig.RichTextCk5;
		case InputFormat.RICH_TEXT_CK5_SIMPLE:
			return inputFormatsSanitizeConfig.RichTextCk5Simple;
		case InputFormat.PLAIN_TEXT:
		default:
			return inputFormatsSanitizeConfig.PlainText;
	}
};

export const sanitizeRichText = (value: string, inputFormat?: InputFormat) => {
	const sanitizeHtmlOptions: sanitize.IOptions = getSanitizeHtmlOptions(inputFormat);

	const sanitized = sanitize(value, sanitizeHtmlOptions);

	return sanitized;
};

/**
 * Decorator to sanitize a string by removing unwanted HTML.
 * Place after IsString decorator.
 * By default, it will return a plain text
 * @returns
 */
export function SanitizeHtml(inputFormat?: InputFormat): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const value = params.obj[params.key];

		if (typeof value !== 'string') {
			return sanitizeRichText(value, inputFormat);
		}

		throw new NotImplementedException('can only sanitize strings');
	});
}
