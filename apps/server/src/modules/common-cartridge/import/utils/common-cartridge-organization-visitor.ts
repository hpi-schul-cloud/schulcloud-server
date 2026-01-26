import { CheerioAPI, SelectorType } from 'cheerio';
import { CommonCartridgeFileParserOptions } from '../common-cartridge-import.types';

export enum CommonCartridgeOrganizationVisitorNodeType {
	ORGANIZATION = 'organization',
	RESOURCE = 'resource',
}

export type CommonCartridgeOrganizationVisitorNodeProps = { identifier: string; title: string; depth: number } & (
	| { type: CommonCartridgeOrganizationVisitorNodeType.ORGANIZATION }
	| { type: CommonCartridgeOrganizationVisitorNodeType.RESOURCE; identifierRef: string; paths: string[] }
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
			const paths = this.getFilePaths(identifierRef);

			this.props = {
				type: CommonCartridgeOrganizationVisitorNodeType.RESOURCE,
				identifier,
				identifierRef,
				title,
				depth,
				paths,
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

	get parent(): CommonCartridgeOrganizationVisitorNode | null {
		const parentIdentifier = this.document(`item[identifier="${this.props.identifier}"]`)
			.parents('item')
			.attr('identifier');

		return parentIdentifier !== undefined ? this.memo.get(parentIdentifier) ?? null : null;
	}

	get children(): CommonCartridgeOrganizationVisitorNode[] {
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

	get organizationPath(): string {
		const ids: string[] = [this.props.identifier];
		let org = this.parent;

		while (org !== null) {
			ids.unshift(org.props.identifier);
			org = org.parent;
		}

		return ids.join('/');
	}

	// The following accessors are for compatibility with the old parser

	get path(): string {
		return this.organizationPath;
	}

	get pathDepth(): number {
		return this.props.depth;
	}

	get identifier(): string {
		return this.props.identifier;
	}

	get identifierRef(): string | undefined {
		if (this.props.type === CommonCartridgeOrganizationVisitorNodeType.RESOURCE) {
			return this.props.identifierRef;
		}

		return undefined;
	}

	get title(): string {
		return this.props.title;
	}

	get isResource(): boolean {
		return this.props.type === CommonCartridgeOrganizationVisitorNodeType.RESOURCE;
	}

	get isInlined(): boolean {
		return false;
	}

	get resourcePaths(): string[] {
		if (this.props.type === CommonCartridgeOrganizationVisitorNodeType.RESOURCE) {
			return this.props.paths;
		}

		return [];
	}

	get resourceType(): string {
		const idRef = this.identifierRef;
		if (idRef !== undefined) {
			const type = this.getResourceType(idRef);
			return type;
		}

		return '';
	}

	private getItemTitle(identifier: string): string {
		const title = this.document(`item[identifier="${identifier}"] > title`).text();

		return title;
	}

	private getFilePaths(identifierRef: string): string[] {
		const fileElements = this.document(`manifest > resources > resource[identifier="${identifierRef}"] > file`);
		const paths = fileElements
			.toArray()
			.map((fileElement) => fileElement.attribs['href'] || null)
			.filter((href) => href !== null);

		const resourceHref = this.document(`manifest > resources > resource[identifier="${identifierRef}"]`).attr('href');
		if (resourceHref && paths.indexOf(resourceHref) === -1) {
			paths.unshift(resourceHref);
		}

		return paths;
	}

	private getResourceType(identifierRef: string): string {
		const type = this.document(`manifest > resources > resource[identifier="${identifierRef}"]`)?.attr('type') || '';

		return type;
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
