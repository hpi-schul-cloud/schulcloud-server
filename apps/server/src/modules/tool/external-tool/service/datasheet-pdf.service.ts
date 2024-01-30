import { Injectable } from '@nestjs/common';
import { createPdf, TCreatedPdf } from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { StyleDictionary } from 'pdfmake/interfaces';
import { ExternalToolDatasheetTemplateData } from '../domain';
import { ToolConfigType } from '../../common/enum';

// TODO: should be typed and tested https://pdfmake.github.io/docs/0.1/
@Injectable()
export class DatasheetPdfService {
	public generatePdf(templateData: ExternalToolDatasheetTemplateData): Promise<Buffer> {
		const deactivated = templateData.isDeactivated ? { text: 'Dieses Tool ist deaktivert.' } : { text: '' };
		const restricted =
			templateData.restrictToContexts && templateData.restrictToContexts.length > 0
				? { text: `Dieses Tool ist auf folgende Kontexte beschränkt: ${templateData.restrictToContexts}` }
				: { text: '' };

		const oauthParam = { text: `Zustimmung überspringen: ${templateData.skipConsent}` };
		const ltiParam1 = { text: `lti_message type: ${templateData.messageType}` };
		const ltiParam2 = { text: `privacy_permissions: ${templateData.privacy}` };
		const toolTypeParams = [{ text: '' }];
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
						{ text: templateData.instance, style: 'right-aligned' },
						{ text: '\n' },
						{ text: 'Datenblatt', style: 'center-aligned' },
						{ text: templateData.toolName, style: 'center-aligned' },
						{ text: templateData.toolUrl, style: 'center-aligned', link: templateData.toolUrl },
						{ text: '\n' },
						deactivated,
						restricted,
						{ text: `Tool-Typ: ${templateData.toolType}`, link: templateData.toolType },
						toolTypeParams,

						...(templateData?.parameters?.length
							? [
									{ text: 'An den Dienst übermittelte Parameter', style: 'h4' },
									{ text: '\n' },
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
