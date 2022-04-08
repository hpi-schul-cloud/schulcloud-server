import { NotImplementedException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import sanitize from 'sanitize-html';

type SanitizeDecoratorOptions = { keep: 'inline' | 'richtext' };

// Note: tag names are not case-sensitive
const INLINE_TAGS = ['b', 'i', 'em', 'strong', 'small', 's', 'u'];
const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const LIST_TAGS = ['ul', 'li', 'ol', 'dl', 'dt', 'dd'];
const PARAGRAPH_TAGS = ['p', 'pre', 'br', 'hr'];
const TABLE_TAGS = ['table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'tr', 'td'];
const OTHER_TAGS = ['a', 'img'];

const getSanitizeHtmlOptions = (options?: SanitizeDecoratorOptions): sanitize.IOptions => {
	let sanitizeHtmlOptions: sanitize.IOptions;

	if (options?.keep === 'inline') {
		sanitizeHtmlOptions = {
			allowedTags: INLINE_TAGS,
		};
	} else if (options?.keep === 'richtext') {
		sanitizeHtmlOptions = {
			allowedTags: [...INLINE_TAGS, ...HEADING_TAGS, ...LIST_TAGS, ...PARAGRAPH_TAGS, ...TABLE_TAGS, ...OTHER_TAGS],
			allowedAttributes: {
				a: ['href', 'name', 'target'],
				img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
			},
		};
	} else {
		sanitizeHtmlOptions = { allowedTags: [], allowedAttributes: {} };
	}

	return sanitizeHtmlOptions;
};

/**
 * Decorator to sanitize a string by removing unwanted HTML.
 * Place after IsString decorator.
 * Options:
 * `keep: inline` allow only simple inline tags
 * `keep: richtext` allow rich text tags
 * default: strip all HTML tags from string
 * @returns
 */
export function SanitizeHtml(options?: SanitizeDecoratorOptions): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const value = params.obj[params.key];

		if (typeof value === 'string') {
			const sanitizeHtmlOptions = getSanitizeHtmlOptions(options);
			const sanitized = sanitize(value, sanitizeHtmlOptions);

			return sanitized;
		}

		throw new NotImplementedException('can only sanitize strings');
	});
}
