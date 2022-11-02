import { NotImplementedException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import sanitize from 'sanitize-html';
import { getSanitizeHtmlOptions, InputFormat } from '@shared/domain';

/**
 * Decorator to sanitize a string by removing unwanted HTML.
 * Place after IsString decorator.
 * @returns
 */
export function SanitizeHtml(inputFormat: InputFormat = InputFormat.PLAIN_TEXT): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const value = params.obj[params.key];

		if (typeof value === 'string') {
			const sanitizeHtmlOptions: sanitize.IOptions = getSanitizeHtmlOptions(inputFormat);

			const sanitized = sanitize(value, sanitizeHtmlOptions);

			return sanitized;
		}

		throw new NotImplementedException('can only sanitize strings');
	});
}
