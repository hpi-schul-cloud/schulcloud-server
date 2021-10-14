import { Transform, TransformFnParams } from 'class-transformer';
import { decode } from 'html-entities';

/**
 * Decorator to transform a string value so that all contained html entities are decoded.
 *
 * The purpose of this decorator is to revert html entity encodings that come from generic
 * input sanitization in the legacy server. We don't need this encoding in the output of our API
 * because in common template systems (e.g handlebars and vue.js) strings are generally
 * escaped for the output. That leads to wrong text output because html entities are rendered "as is"
 * with all characters encoded again.
 *
 * Examples:
 * - when text = "X &amp; Y" and template is {{ text }} it is rendered as "X &#x26;amp; Y" => wrong
 * - when text = "X & Y"     and template is {{ text }} it is rendered as "X &amp; Y"      => good
 *
 * (both for vue.js and handlebars)
 *
 * Use this decorator in your response DTO wherever redundant html encoding from the legacy server has to be reverted.
 *
 * IMPORTANT: Should be removed later when sanitization works properly
 *
 * @returns the string with decoded html entities
 */
export function DecodeHtmlEntities(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const str = params.obj[params.key] as string;
		const res = decode(str);
		return res;
	});
}
