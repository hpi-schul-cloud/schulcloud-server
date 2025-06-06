/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';

import type { DOMPurify } from 'dompurify';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { ExternalToolImageSanitizationLoggableException } from '../loggable';

@Injectable()
export class ExternalToolImageSanitizerService {
	constructor(private readonly logger: Logger, private readonly sanitizer: DOMPurify) {
		const { window } = new JSDOM('<!DOCTYPE html>');

		this.sanitizer = createDOMPurify(window);
	}

	public sanitizeSvgToBase64(svgContent: string): string {
		if (typeof svgContent !== 'string' || svgContent.trim() === '') {
			this.logger.debug(new ExternalToolImageSanitizationLoggableException());
			throw new ExternalToolImageSanitizationLoggableException();
		}

		try {
			const sanitizedSvg = this.sanitizer.sanitize(svgContent, {
				USE_PROFILES: { svg: true },
			});

			if (!sanitizedSvg || typeof sanitizedSvg !== 'string' || sanitizedSvg.trim() === '') {
				this.logger.debug(new ExternalToolImageSanitizationLoggableException());
				throw new ExternalToolImageSanitizationLoggableException();
			}

			const base64 = Buffer.from(sanitizedSvg, 'utf-8').toString('base64');
			return `data:image/svg+xml;base64,${base64}`;
		} catch (error) {
			this.logger.debug(new ExternalToolImageSanitizationLoggableException());
			throw new ExternalToolImageSanitizationLoggableException();
		}
	}
}
