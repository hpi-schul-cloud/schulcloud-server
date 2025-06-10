/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const { window } = new JSDOM('<!DOCTYPE html>');
		this.sanitizer = createDOMPurify(window);
	}

	public sanitizeSvg(svgContent: string): string {
		if (typeof svgContent !== 'string' || svgContent.trim() === '') {
			throw new ExternalToolLogoSanitizationLoggableException('SVG cannot be sanized because it is empty or invalid.');
		}

		try {
			const sanitizedSvg = this.sanitizer.sanitize(svgContent, { USE_PROFILES: { svg: true }, FORBID_TAGS: ['image'] });

			if (!sanitizedSvg || typeof sanitizedSvg !== 'string' || sanitizedSvg.trim() === '') {
				throw new ExternalToolLogoSanitizationLoggableException('Sanitized SVG is empty or invalid.');
			}

			return sanitizedSvg;
		} catch {
			throw new ExternalToolLogoSanitizationLoggableException('SVG sanitization failed');
		}
	}
}
