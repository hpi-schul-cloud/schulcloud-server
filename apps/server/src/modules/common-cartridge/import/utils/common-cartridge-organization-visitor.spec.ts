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

			it('should return the organizations ', async () => {
				const { sut } = await setup();

				const result = sut.findAllNodes();

				expect(result).toHaveLength(117);
			});

			it('should provide data for these organizations', async () => {
				const { sut } = await setup();

				const result = sut.findAllNodes();

				expect(result).toHaveLength(117);

				result.forEach((org) => {
					expect(org.path).toStrictEqual(expect.any(String));
					expect(org.pathDepth).toStrictEqual(expect.any(Number));
					expect(org.identifier).toStrictEqual(expect.any(String));
					expect(org.title).toStrictEqual(expect.any(String));
					expect(org.isInlined).toStrictEqual(expect.any(Boolean));
					expect(org.isResource).toStrictEqual(expect.any(Boolean));
					if (org.isResource) {
						expect(org.resourcePath).toStrictEqual(expect.any(String));
						expect(org.resourceType).toStrictEqual(expect.any(String));
						expect(org.identifierRef).toStrictEqual(expect.any(String));
					} else {
						expect(org.resourcePath).toStrictEqual('');
						expect(org.resourceType).toStrictEqual('');
						expect(org.identifierRef).toBeUndefined();
					}
				});
			});

			it('should correctly link parents to children', async () => {
				const { sut } = await setup();

				const result = sut.findAllNodes();

				result
					.filter((org) => org.pathDepth === 0)
					.forEach((org) => {
						expect(org.parent).toBeNull();
					});

				const org = result.filter((org) => org.pathDepth === 0)[0];
				org.children.forEach((child) => {
					expect(child.parent).not.toBeNull();
					expect(child.parent?.identifier).toBe(org.identifier);
				});
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
