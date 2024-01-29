import { Injectable } from '@nestjs/common';
import { createPdf, TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { StyleDictionary } from 'pdfmake/interfaces';
import { ExternalToolDatasheetTemplateData } from '../domain';

// TODO: should be typed and tested https://pdfmake.github.io/docs/0.1/
@Injectable()
export class DatasheetPdfService {
	public generatePdf(templateData: ExternalToolDatasheetTemplateData): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			try {
				const documentDefinition = {
					content: [
						{ text: `Erstellt am ${templateData.createdAt} von ${templateData.creatorName}`, style: 'right-aligned' },
						{ text: templateData.instance, style: 'right-aligned' },
						{ text: 'Datenblatt', style: 'center-aligned' },
						{ text: templateData.toolName, style: 'center-aligned' },
						{ text: templateData.toolUrl, style: 'center-aligned', link: templateData.toolUrl },
						{ text: templateData.toolType, link: templateData.toolType },
						{ text: '' }, // line break

						...(templateData?.parameters?.length
							? [
									{ text: 'An den Dienst übermittelte Parameter', style: 'h4' },
									{
										table: {
											headerRows: 1,
											widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
											body: [
												['Name', 'Typ', 'Eigenschaften', 'Geltungsbereich', 'Ort'],
												...templateData.parameters.map((param) => [
													param.name,
													param.type,
													param.properties,
													param.scope,
													param.location,
												]),
											],
										},
									},
							  ]
							: []),
					],
					styles: {
						'right-aligned': { alignment: 'right' },
						'center-aligned': { alignment: 'center' },
						h4: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
					} as StyleDictionary,
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
