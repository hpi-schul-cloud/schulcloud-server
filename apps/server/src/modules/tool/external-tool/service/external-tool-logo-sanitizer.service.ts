import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';

import type { DOMPurify } from 'dompurify';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { ExternalToolLogoSanitizationLoggableException } from '../loggable';

@Injectable()
export class ExternalToolLogoSanitizerService {
	private readonly sanitizer: DOMPurify;

	constructor(private readonly logger: Logger) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		const { window } = new JSDOM('<!DOCTYPE html>');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.sanitizer = createDOMPurify(window);
	}

	public sanitizeSvg(svgContent: string): string {
		if (svgContent.trim() === '') {
			throw new ExternalToolLogoSanitizationLoggableException(
				'SVG sanitization falied: SVG to be sanitized is invalid.'
			);
		}

		const sanitizedSvg = this.sanitizer.sanitize(svgContent, { USE_PROFILES: { svg: true }, FORBID_TAGS: ['image'] });

		if (!sanitizedSvg || typeof sanitizedSvg !== 'string' || sanitizedSvg.trim() === '') {
			throw new ExternalToolLogoSanitizationLoggableException('SVG sanitization falied: Sanitized SVG is invalid.');
		}

		return sanitizedSvg;
	}
}
