import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import Mustache from 'mustache';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
	generatePdfFromTemplate<T>(templatePath: string, data: T): Promise<Buffer> {
		const promise: Promise<Buffer> = new Promise<Buffer>((resolve, reject) => {
			const template: string = this.readTemplateFile(templatePath);
			const rendered: string = Mustache.render(template, data);

			const pdf: PDFKit.PDFDocument = new PDFDocument();
			const chunks: Uint8Array[] = [];

			pdf.on('data', (chunk: Uint8Array) => chunks.push(chunk));
			pdf.on('end', () => resolve(Buffer.concat(chunks)));
			pdf.on('error', (error: Error) => reject(error));

			pdf.text(rendered);

			pdf.end();
		});

		return promise;
	}

	private readTemplateFile(templatePath: string): string {
		try {
			return fs.readFileSync(templatePath, 'utf8');
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
			throw new Error(`Error reading template file: ${error.message}`);
		}
	}
}
