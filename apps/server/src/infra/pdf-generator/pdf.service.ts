import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as mustache from 'mustache';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class PdfService {
	async generatePdfFromTemplate<T>(templatePath: string, data: T): Promise<Buffer> {
		const template: string = this.readTemplateFile(templatePath);
		const html: string = this.renderTemplate(template, data);
		const browser: Browser = await puppeteer.launch({ headless: 'new' });
		const page: Page = await browser.newPage();

		await page.setContent(html);
		const pdfBuffer: Buffer = await page.pdf();

		await browser.close();

		return pdfBuffer;
	}

	private readTemplateFile(templatePath: string): string {
		try {
			return fs.readFileSync(templatePath, 'utf8');
		} catch (error) {
			throw new Error(`Error reading template file: ${error.message}`);
		}
	}

	private renderTemplate<T>(template: string, data: T): string {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
		return mustache.render(template, data);
	}
}
