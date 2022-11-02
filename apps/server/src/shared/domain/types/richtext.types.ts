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

export const PlainTextSanitizeConfig: IInputFormatsConfig = {
	allowedTags: [],
	allowedAttributes: {},
};

export const RichTextSimple: IInputFormatsConfig = {
	allowedTags: ['b', 'i', 'em', 'strong', 'small', 's', 'u'],
	allowedAttributes: {},
};

const RichText: IInputFormatsConfig = {
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
};

// TODO
const RichTextCk4: IInputFormatsConfig = {
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
};

// TODO
const RichTextCk5Simple: IInputFormatsConfig = {
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
};

// TODO
const RichTextCk5: IInputFormatsConfig = {
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
};

export const getSanitizeHtmlOptions = (inputFormat: InputFormat): IInputFormatsConfig => {
	switch (inputFormat) {
		case InputFormat.RICHTEXT_SIMPLE:
			return RichTextSimple;
		case InputFormat.RICH_TEXT:
			return RichText;
		case InputFormat.RICH_TEXT_CK4:
			return RichTextCk4;
		case InputFormat.RICH_TEXT_CK5:
			return RichTextCk5;
		case InputFormat.RICH_TEXT_CK5_SIMPLE:
			return RichTextCk5Simple;
		case InputFormat.PLAIN_TEXT:
		default:
			return PlainTextSanitizeConfig;
	}
};
