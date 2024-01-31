import { Injectable } from '@nestjs/common';
import { createPdf, TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { StyleDictionary } from 'pdfmake/interfaces';
import { ExternalToolDatasheetTemplateData, ExternalToolParameterDatasheetTemplateData } from '../domain';
import { ToolConfigType } from '../../common/enum';

@Injectable()
export class DatasheetPdfService {
	public generatePdf(templateData: ExternalToolDatasheetTemplateData): Promise<Buffer> {
		const deactivated: string = templateData.isDeactivated ? 'Dieses Tool ist deaktivert.' : '';
		const restricted: string =
			templateData.restrictToContexts && templateData.restrictToContexts.length > 0
				? `Dieses Tool ist auf folgende Kontexte beschränkt:${templateData.restrictToContexts}`
				: '';

		const oauthParam: string = templateData.skipConsent ? `Zustimmung überspringen: ${templateData.skipConsent}` : '';
		const ltiParam1 = `Message Type: ${templateData.messageType}`;
		const ltiParam2 = `Privatsphäre: ${templateData.privacy}`;
		const toolTypeParams = [''];
		if (templateData.toolType === ToolConfigType.OAUTH2) {
			toolTypeParams.push(oauthParam);
		}
		if (templateData.toolType === ToolConfigType.LTI11) {
			toolTypeParams.push(ltiParam1, ltiParam2);
		}

		return new Promise<Buffer>((resolve, reject) => {
			try {
				const documentDefinition = {
					content: [
						{ text: `Erstellt am ${templateData.createdAt} von ${templateData.creatorName}`, style: 'right-aligned' },
						'\n',
						{ text: templateData.instance, style: 'right-aligned' },
						'\n',
						{ text: 'Datenblatt', style: ['center-aligned', 'h1'] },
						{ text: templateData.toolName, style: ['center-aligned', 'h2'] },
						'\n',
						{ text: templateData.toolUrl, style: ['center-aligned', 'link'], link: templateData.toolUrl },
						'\n\n',
						deactivated,
						restricted,
						'\n',
						`Typ des Tools: ${templateData.toolType}`,
						toolTypeParams,

						...(templateData?.parameters?.length
							? [
									{ text: 'An den Dienst übermittelte Parameter', style: 'h4' },
									'\n',
									{
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
									},
							  ]
							: ['\n', 'Die Konfiguration dieses Tools enthält keine benutzerspezifischen Parameter.']),
					],
					styles: {
						'right-aligned': { alignment: 'right' },
						'center-aligned': { alignment: 'center' },
						h4: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
						h1: { fontSize: 22, bold: true, margin: [0, 10, 0, 5] },
						h2: { fontSize: 18, bold: true, margin: [0, 10, 0, 5] },
						link: { color: 'blue', decoration: 'underline' },
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
