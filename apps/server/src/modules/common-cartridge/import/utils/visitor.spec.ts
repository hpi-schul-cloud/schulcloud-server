import { InputFormat } from '@shared/domain/types';
import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import { readFile } from 'fs/promises';
import { CommonCartridgeOrganizationVisitor, CommonCartridgeOrganizationVisitorNodeType } from './visitor';

describe('Visitor', () => {
	let archive: AdmZip;

	const setup = () => {
		const manifest = archive.readAsText('imsmanifest.xml');
		const sut = new CommonCartridgeOrganizationVisitor(load(manifest), {
			inputFormat: InputFormat.RICH_TEXT_CK4,
			maxSearchDepth: 10,
			pathSeparator: '/',
		});
		return { sut };
	};

	beforeAll(async () => {
		const buffer = await readFile('./apps/server/src/modules/common-cartridge/testing/assets/dbc_course.zip');

		archive = new AdmZip(buffer);
	});

	it('should return the organizations', () => {
		const { sut } = setup();

		const result = sut.findAllNodes();

		expect(result).toHaveLength(16);

		expect(result.filter((node) => node.props.depth === 0)).toHaveLength(3);
		expect(result.filter((node) => node.props.depth === 1)).toHaveLength(6);
		expect(result.filter((node) => node.props.depth === 2)).toHaveLength(4);
		expect(result.filter((node) => node.props.depth === 3)).toHaveLength(3);

		expect(
			result.filter((node) => node.props.type === CommonCartridgeOrganizationVisitorNodeType.ORGANIZATION)
		).toHaveLength(11);
		expect(
			result.filter((node) => node.props.type === CommonCartridgeOrganizationVisitorNodeType.RESOURCE)
		).toHaveLength(5);

		expect(result[0]).toStrictEqual(result[3].parent);

		expect(result[0].children).toHaveLength(1);
		expect(result[1].children).toHaveLength(1);
		expect(result[2].children).toHaveLength(4);
	});
});
