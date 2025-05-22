import { DEFAULT_FILE_PARSER_OPTIONS } from '@modules/common-cartridge';
import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import { readFile } from 'fs/promises';
import { CommonCartridgeOrganizationVisitor } from './common-cartridge-organization-visitor';

describe(CommonCartridgeOrganizationVisitor.name, () => {
	const setupDocument = async (loadFile: boolean) => {
		if (!loadFile) {
			const document = load('<manifest></manifest>', { xml: true });

			return document;
		}

		const buffer = await readFile(
			'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc'
		);
		const archive = new AdmZip(buffer);
		const document = load(archive.readAsText('imsmanifest.xml'), { xml: true });

		return document;
	};

	describe('findAllNodes', () => {
		describe('when organizations are present', () => {
			const setup = async () => {
				const document = await setupDocument(true);
				const sut = new CommonCartridgeOrganizationVisitor(document, DEFAULT_FILE_PARSER_OPTIONS);

				return { sut };
			};

			it('should return the organizations', async () => {
				const { sut } = await setup();

				const result = sut.findAllNodes();

				expect(result).toHaveLength(117);
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

				const result = sut.findAllNodes();

				expect(result).toHaveLength(0);
			});
		});
	});
});
