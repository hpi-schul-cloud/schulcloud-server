import AdmZip from 'adm-zip';
import { readFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import { DEFAULT_FILE_PARSER_OPTIONS } from '../common-cartridge-import.types';
import { CommonCartridgeOrganizationVisitor } from './common-cartridge-organization-visitor';

describe('CommonCartridgeOrganizationVisitor', () => {
	const setupDocument = async (loadFile: boolean) => {
		if (!loadFile) {
			const { document } = new JSDOM('<manifest></manifest>', { contentType: 'text/xml' }).window;

			return document;
		}

		const buffer = await readFile('./apps/server/test/assets/common-cartridge/us_history_since_1877.imscc');
		const archive = new AdmZip(buffer);
		const { document } = new JSDOM(archive.readAsText('imsmanifest.xml'), { contentType: 'text/xml' }).window;

		return document;
	};

	describe('findAllOrganizations', () => {
		describe('when organizations are present', () => {
			const setup = async () => {
				const document = await setupDocument(true);
				const sut = new CommonCartridgeOrganizationVisitor(document, {
					maxSearchDepth: 1,
					pathSeparator: DEFAULT_FILE_PARSER_OPTIONS.pathSeparator,
				});

				return { sut };
			};

			it('should return the organizations', async () => {
				const { sut } = await setup();

				const result = sut.findAllOrganizations();

				expect(result).toHaveLength(14);
			});
		});

		describe('when organizations are not present', () => {
			const setup = async () => {
				const document = await setupDocument(false);
				const sut = new CommonCartridgeOrganizationVisitor(document, DEFAULT_FILE_PARSER_OPTIONS);

				return { sut };
			};

			it('should return an empty array', async () => {
				const { sut } = await setup();

				const result = sut.findAllOrganizations();

				expect(result).toHaveLength(0);
			});
		});
	});
});
