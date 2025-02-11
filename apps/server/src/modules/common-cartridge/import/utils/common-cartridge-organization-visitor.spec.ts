import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';
import { readFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import { CommonCartridgeOrganizationProps, DEFAULT_FILE_PARSER_OPTIONS } from '../common-cartridge-import.types';
import { CommonCartridgeOrganizationVisitor } from './common-cartridge-organization-visitor';

describe('CommonCartridgeOrganizationVisitor', () => {
	describe('findAllOrganizations', () => {
		describe('when organizations are present', () => {
			const setup = async () => {
				const buffer = await readFile('./apps/server/src/modules/common-cartridge/testing/assets/dbc_course.zip');
				const archive = new AdmZip(buffer);
				const { document } = new JSDOM(archive.readAsText('imsmanifest.xml'), { contentType: 'text/xml' }).window;
				const sut = new CommonCartridgeOrganizationVisitor(document, {
					maxSearchDepth: 10,
					pathSeparator: DEFAULT_FILE_PARSER_OPTIONS.pathSeparator,
					inputFormat: DEFAULT_FILE_PARSER_OPTIONS.inputFormat,
				});

				return { sut };
			};

			it('cheerio', async () => {
				const buffer = await readFile('./apps/server/src/modules/common-cartridge/testing/assets/dbc_course.zip');
				const archive = new AdmZip(buffer);
				const manifest = archive.readAsText('imsmanifest.xml');
				const $ = cheerio.load(manifest, { xmlMode: true });
				const organizations = $('manifest > organizations > organization > item > item');

				expect($).toBeDefined();
				expect(organizations).toBeDefined();
			});

			it.skip('should return the organizations', async () => {
				const { sut } = await setup();

				const result = sut.findAllOrganizations();

				result.forEach((organization) => {
					expect(organization).toEqual<CommonCartridgeOrganizationProps>({
						identifier: expect.any(String),
						identifierRef: expect.any(String),
						title: expect.any(String),
						path: expect.any(String),
						pathDepth: expect.any(Number),
						isResource: expect.any(Boolean),
						isInlined: expect.any(Boolean),
						resourcePath: expect.any(String),
						resourceType: expect.any(String),
					});
				});

				// expect(result).toHaveLength(16);
				// organizations with depth 0
				expect(result.filter((org) => org.pathDepth === 0)).toHaveLength(3);
				// organizations with depth 1
				expect(result.filter((org) => org.pathDepth === 1)).toHaveLength(6);
				// organizations with depth 2
				expect(result.filter((org) => org.pathDepth === 2)).toHaveLength(4);
				// organizations with depth 3;
				expect(result.filter((org) => org.pathDepth === 3)).toHaveLength(3);
			});
		});

		describe('when organizations are not present', () => {
			const setup = () => {
				const { document } = new JSDOM('<manifest></manifest>', { contentType: 'text/xml' }).window;
				const sut = new CommonCartridgeOrganizationVisitor(document, DEFAULT_FILE_PARSER_OPTIONS);

				return { sut };
			};

			it('should return an empty array', () => {
				const { sut } = setup();

				const result = sut.findAllOrganizations();

				expect(result).toHaveLength(0);
			});
		});
	});
});
