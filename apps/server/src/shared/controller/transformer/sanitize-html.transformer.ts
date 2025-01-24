import { NotImplementedException } from '@nestjs/common';
import { InputFormat } from '@shared/domain/types/input-format.types';
import { Transform, TransformFnParams } from 'class-transformer';
import { decode } from 'html-entities';
import sanitize, { AllowedAttribute, IOptions } from 'sanitize-html';

export type IInputFormatsConfig = {
	allowedTags: string[]; // Note: tag names are not case-sensitive
	allowedAttributes?: Record<string, AllowedAttribute[]>;
};

const inputFormatsSanitizeConfig: Record<string, IOptions> = {
	PlainText: {
		allowedTags: [],
		allowedAttributes: {},
		textFilter: (text: string) => decode(text),
	},

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

	RichTextCk5: {
		allowedTags: [
			'h4',
			'h5',
			'p',
			'span',
			'br',
			'strong',
			'b',
			'i',
			'em',
			'u',
			's',
			'code',
			'sup',
			'sub',
			'mark',
			'blockquote',
			'ul',
			'ol',
			'li',
			'hr',
			'table',
			'thead',
			'tbody',
			'tr',
			'td',
			'th',
			'a',
			'figure',
		],
		allowedAttributes: {
			a: ['href', 'name', 'target', 'rel'],
			figure: ['class'],
			mark: ['class'],
			span: ['class', 'style'],
		},
	},

	RichTextCk5Simple: {
		allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img', 'src'],
		allowedAttributes: {
			img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
		},
	},
};

export const getSanitizeHtmlOptions = (inputFormat?: InputFormat): IOptions => {
	switch (inputFormat) {
		case InputFormat.RICH_TEXT_CK5_SIMPLE:
			return inputFormatsSanitizeConfig.RichTextCk5Simple;
		case InputFormat.RICH_TEXT_CK4:
			return inputFormatsSanitizeConfig.RichTextCk4;
		case InputFormat.RICH_TEXT_CK5:
			return inputFormatsSanitizeConfig.RichTextCk5;
		case InputFormat.PLAIN_TEXT:
		default:
			return inputFormatsSanitizeConfig.PlainText;
	}
};

export const sanitizeRichText = (value: string, inputFormat?: InputFormat): string => {
	const sanitizeHtmlOptions = getSanitizeHtmlOptions(inputFormat);

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

		if (typeof value === 'string') {
			return sanitizeRichText(value, inputFormat);
		}

		throw new NotImplementedException('can only sanitize strings');
	});
}
