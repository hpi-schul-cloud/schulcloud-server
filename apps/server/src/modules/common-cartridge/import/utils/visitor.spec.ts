import { CheerioAPI, load, SelectorType } from 'cheerio';
import AdmZip from 'adm-zip';
import { readFile } from 'fs/promises';
import { InputFormat } from '@shared/domain/types';
import { CommonCartridgeFileParserOptions } from '../common-cartridge-import.types';

export enum CommonCartridgeOrganizationVisitorNodeType {
	ORGANIZATION = 'organization',
	RESOURCE = 'resource',
}

export type CommonCartridgeOrganizationVisitorNodeProps = { identifier: string; title: string; depth: number } & (
	| { type: CommonCartridgeOrganizationVisitorNodeType.ORGANIZATION }
	| { type: CommonCartridgeOrganizationVisitorNodeType.RESOURCE; identifierRef: string; path: string }
);

export class CommonCartridgeOrganizationVisitorNode {
	public readonly props: Readonly<CommonCartridgeOrganizationVisitorNodeProps>;

	constructor(
		identifier: string,
		identifierRef: string | undefined,
		depth: number,
		private readonly document: CheerioAPI,
		private readonly memo: Map<string, CommonCartridgeOrganizationVisitorNode>
	) {
		const title = this.getItemTitle(identifier);

		if (identifierRef) {
			const path = this.getFilePath(identifierRef);

			this.props = {
				type: CommonCartridgeOrganizationVisitorNodeType.RESOURCE,
				identifier,
				identifierRef,
				title,
				depth,
				path,
			};
		} else {
			this.props = {
				type: CommonCartridgeOrganizationVisitorNodeType.ORGANIZATION,
				identifier,
				title,
				depth,
			};
		}
	}

	public get parent(): CommonCartridgeOrganizationVisitorNode | null {
		const parentIdentifier = this.document(`item[identifier="${this.props.identifier}"]`)
			.parents('item')
			.attr('identifier');

		if (!parentIdentifier) {
			return null;
		}

		return this.memo.get(parentIdentifier) ?? null;
	}

	public get children(): CommonCartridgeOrganizationVisitorNode[] {
		const result = new Array<CommonCartridgeOrganizationVisitorNode>();
		const elements = this.document(`item[identifier="${this.props.identifier}"] > item`);

		for (const element of elements) {
			const { identifier } = element.attribs;
			const node = this.memo.get(identifier);

			if (node) {
				result.push(node);
			}
		}

		return result;
	}

	private getItemTitle(identifier: string): string {
		const title = this.document(`item[identifier="${identifier}"] > title`).text();

		return title;
	}

	private getFilePath(identifierRef: string): string {
		const path =
			this.document(`manifest > resources > resource[identifier="${identifierRef}"] > file`).attr('href') ?? '';

		return path;
	}
}

export class CommonCartridgeOrganizationVisitor {
	private readonly memo: Map<string, CommonCartridgeOrganizationVisitorNode> = new Map();

	constructor(private readonly manifest: CheerioAPI, private readonly options: CommonCartridgeFileParserOptions) {}

	public findAllNodes(): CommonCartridgeOrganizationVisitorNode[] {
		for (let depth = 0; depth < this.options.maxSearchDepth; depth += 1) {
			const selector = this.getItemsSelector(depth);
			const elements = this.manifest(selector);

			if (elements.length === 0) {
				break;
			}

			for (const element of elements) {
				const { identifier, identifierref } = element.attribs;
				const node = new CommonCartridgeOrganizationVisitorNode(
					identifier,
					identifierref,
					depth,
					this.manifest,
					this.memo
				);

				this.memo.set(identifier, node);
			}
		}

		const result = Array.from(this.memo.values());

		return result;
	}

	private getItemsSelector(depth: number): SelectorType {
		const rootSelector = 'manifest > organizations > organization > item > item';
		const depthSelector = ' > item'.repeat(depth);
		const selector = `${rootSelector}${depthSelector}`;

		return selector as SelectorType;
	}
}

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
