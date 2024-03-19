import { Injectable } from '@nestjs/common';
import { createPdf, TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { ExternalToolDatasheetTemplateData, ExternalToolParameterDatasheetTemplateData } from '../domain';

@Injectable()
export class DatasheetPdfService {
	public generatePdf(templateData: ExternalToolDatasheetTemplateData): Promise<Buffer> {
		const content: Content = [];

		content.push(
			{ text: `Erstellt am ${templateData.createdAt} von ${templateData.creatorName}`, style: 'right-aligned' },
			'\n',
			{ text: templateData.instance, style: 'right-aligned' },
			'\n'
		);

		if (templateData.schoolName) {
			content.push({ text: templateData.schoolName, style: 'right-aligned' }, '\n');
		}

		content.push(
			{ text: 'Datenblatt', style: ['center-aligned', 'h1'] },
			{ text: templateData.toolName, style: ['center-aligned', 'h2'] },
			'\n',
			{ text: templateData.toolUrl, style: ['center-aligned', 'link'], link: templateData.toolUrl },
			'\n\n'
		);

		if (templateData.isDeactivated) {
			content.push(templateData.isDeactivated);
		}

		if (templateData.restrictToContexts?.length) {
			content.push(`Dieses Tool ist auf folgende Kontexte beschränkt: ${templateData.restrictToContexts}`);
		}

		content.push('\n', `Typ des Tools: ${templateData.toolType}`);

		if (templateData.toolType === 'OAuth 2.0' && templateData.skipConsent) {
			content.push(templateData.skipConsent);
		}

		if (templateData.toolType === 'LTI 1.1' && templateData.messageType && templateData.privacy) {
			content.push(`Message Type: ${templateData.messageType}`, `Privatsphäre: ${templateData.privacy}`);
		}

		if (templateData.parameters?.length) {
			content.push({ text: 'An den Dienst übermittelte Parameter', style: 'h4' }, '\n', {
				table: {
					headerRows: 1,
					widths: [200, 'auto', 'auto', 'auto', 'auto'],
					body: [
						['Name', 'Typ', 'Eigenschaften', 'Geltungsbereich', 'Ort '],
						...templateData.parameters.map((param: ExternalToolParameterDatasheetTemplateData) => [
							param.name,
							param.type,
							param.properties,
							param.scope,
							param.location,
						]),
					],
				},
			});
		} else {
			content.push('\n', 'Die Konfiguration dieses Tools enthält keine benutzerspezifischen Parameter.');
		}

		return new Promise<Buffer>((resolve, reject) => {
			try {
				const documentDefinition: TDocumentDefinitions = {
					content,
					styles: {
						'right-aligned': { alignment: 'right' },
						'center-aligned': { alignment: 'center' },
						h4: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
						h1: { fontSize: 22, bold: true, margin: [0, 10, 0, 5] },
						h2: { fontSize: 18, bold: true, margin: [0, 10, 0, 5] },
						link: { color: 'blue', decoration: 'underline' },
					},
				};

				const pdfDoc: TCreatedPdf = createPdf(documentDefinition, {}, undefined, pdfFonts.pdfMake.vfs);
				pdfDoc.getBuffer((buffer: Buffer): void => {
					resolve(buffer);
				});
			} catch (error) {
				reject(error);
			}
		});
	}
}
