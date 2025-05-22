import { CheerioAPI } from 'cheerio';
import { CommonCartridgeFileParserOptions } from './common-cartridge-import.types';
import {
	CommonCartridgeOrganizationVisitor,
	CommonCartridgeOrganizationVisitorNode,
} from './utils/common-cartridge-organization-visitor';

export class CommonCartridgeManifestParser {
	constructor(private readonly manifest: CheerioAPI, private readonly options: CommonCartridgeFileParserOptions) {}

	public getSchema(): string | undefined {
		const result = this.manifest('manifest > metadata > schema').text() || undefined;

		return result;
	}

	public getVersion(): string | undefined {
		const result = this.manifest('manifest > metadata > schemaversion').text() || undefined;

		return result;
	}

	public getTitle(): string | undefined {
		const pre = this.getLomNamespace();
		const result =
			this.manifest(
				`manifest > metadata > ${pre}\\:lom > ${pre}\\:general > ${pre}\\:title > ${pre}\\:string`
			).text() || undefined;

		return result;
	}

	public getOrganizations(): CommonCartridgeOrganizationVisitorNode[] {
		const visitor = new CommonCartridgeOrganizationVisitor(this.manifest, this.options);
		const result = visitor.findAllNodes();

		return result;
	}

	private getLomNamespace(): string {
		const lomCC11 = 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest';
		const lomCC13 = 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest';
		const attributes = this.manifest('manifest').attr() as object;
		const map = new Map<string, string>();
		let result = '';

		Object.keys(attributes).forEach((attributeName) => {
			const attributeValue = attributes[attributeName] as string;
			map.set(attributeValue, attributeName);
		});

		if (map.has(lomCC11)) {
			result = map.get(lomCC11) as string;
		}

		if (map.has(lomCC13)) {
			result = map.get(lomCC13) as string;
		}

		return result.split(':')[1];
	}
}
