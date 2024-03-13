import { JSDOM } from 'jsdom';

export type OrganizationProps = {
	path: string;
	identifier: string;
	identifierRef?: string;
	title: string;
};

export type ManifestParserOptions = {
	maxOrganizationSearchDepth: number;
	pathSeparator: string;
};

export class CommonCartridgeManifestParser {
	private readonly doc: Document;

	public constructor(
		manifest: string,
		private readonly options: ManifestParserOptions = { maxOrganizationSearchDepth: 3, pathSeparator: '/' }
	) {
		this.doc = new JSDOM(manifest, { contentType: 'text/xml' }).window.document;
	}

	public getSchema(): string | undefined {
		const result = this.doc.querySelector('manifest > metadata > schema');

		return result?.textContent ?? undefined;
	}

	public getVersion(): string | undefined {
		const result = this.doc.querySelector('manifest > metadata > schemaversion');

		return result?.textContent ?? undefined;
	}

	public getTitle(): string | undefined {
		const result = this.doc.querySelector('manifest > metadata > lom > general > title > string');

		return result?.textContent ?? undefined;
	}

	public getOrganizations(): OrganizationProps[] {
		const orgs = new Array<OrganizationProps>();
		const result = this.doc.querySelectorAll('manifest > organizations > organization > item > item');

		result.forEach((currentElement) => {
			const currentTitle = currentElement.querySelector('title')?.textContent ?? 'NO_TITLE';

			this.traverseElement(currentElement, this.options.maxOrganizationSearchDepth, 0, (childElement) => {
				const childTitle = childElement.querySelector('title')?.textContent ?? 'NO_TITLE';
				const identifier = childElement.getAttribute('identifier') ?? 'NO_IDENTIFIER';
				const identifierRef = childElement.getAttribute('identifierref') ?? undefined;

				orgs.push({
					path:
						currentTitle === childTitle ? currentTitle : `${currentTitle}${this.options.pathSeparator}${childTitle}`,
					identifier,
					identifierRef,
					title: childTitle,
				});
			});
		});

		return orgs;
	}

	private traverseElement(
		element: Element,
		maxDepth: number,
		currentDepth: number,
		action: (element: Element) => void
	): void {
		if (currentDepth > maxDepth) {
			return;
		}

		action(element);

		element.querySelectorAll('item').forEach((child) => {
			this.traverseElement(child, maxDepth, currentDepth + 1, action);
		});
	}
}
