import { AllowedAttribute } from 'sanitize-html';

export enum InputFormat {
	PLAIN_TEXT = 'plaintext',
	RICH_TEXT = 'richtext',
	RICHTEXT_SIMPLE = 'inline',
	RICH_TEXT_CK4 = 'richtext_ck4',
	RICH_TEXT_CK5 = 'richtext_ck5',
	RICH_TEXT_CK5_SIMPLE = 'richtext_ck5_inline',
}

export interface RichText {
	content: string;
	type: InputFormat;
}

type IInputFormatsConfig = {
	allowedTags: string[]; // Note: tag names are not case-sensitive
	allowedAttributes?: Record<string, AllowedAttribute[]>;
};

const InputFormatsSanitizeConfig: Record<string, IInputFormatsConfig> = {
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
			// eslint-disable
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
			// eslint-enabled
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

export const getSanitizeHtmlOptions = (inputFormat: InputFormat): IInputFormatsConfig => {
	switch (inputFormat) {
		case InputFormat.RICHTEXT_SIMPLE:
			return InputFormatsSanitizeConfig.RichTextSimple;
		case InputFormat.RICH_TEXT:
			return InputFormatsSanitizeConfig.RichText;
		case InputFormat.RICH_TEXT_CK4:
			return InputFormatsSanitizeConfig.RichTextCk4;
		case InputFormat.RICH_TEXT_CK5:
			return InputFormatsSanitizeConfig.RichTextCk5;
		case InputFormat.RICH_TEXT_CK5_SIMPLE:
			return InputFormatsSanitizeConfig.RichTextCk5Simple;
		case InputFormat.PLAIN_TEXT:
		default:
			return InputFormatsSanitizeConfig.PlainText;
	}
};
