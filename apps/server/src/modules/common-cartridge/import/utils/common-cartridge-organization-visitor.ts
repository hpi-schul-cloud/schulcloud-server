import { CommonCartridgeFileParserOptions, CommonCartridgeOrganizationProps } from '../common-cartridge-import.types';

type SearchElement = { depth: number; path: string; element: Element };

/*
 * `CommonCartridgeOrganizationVisitor` is a class that is used to traverse and extract information from
 * an XML document representing a Common Cartridge package. The class uses a breadth-first search algorithm
 * to visit 'item' elements in the XML document, up to a specified maximum depth.
 *
 * The class is initialized with an XML document and an optional `ManifestParserOptions` object, which can
 * specify the maximum search depth and the path separator to use when constructing paths to elements.
 *
 * The main public method of the class is `findAllOrganizations()`, which returns an array of `OrganizationProps`
 * objects representing all the 'organization' elements in the XML document. Each `OrganizationProps` object
 * includes the path to the element, the identifier of the element, the identifierref of the element, and the
 * title of the element.
 *
 * The class also includes several private helper methods for initializing the search, determining whether to
 * continue the search, visiting an element, and creating an `OrganizationProps` object for an element.
 */
export class CommonCartridgeOrganizationVisitor {
	constructor(private readonly document: Document, private readonly options: CommonCartridgeFileParserOptions) {}

	public findAllOrganizations(): CommonCartridgeOrganizationProps[] {
		const organizations = this.search().map((element) => this.createOrganizationProps(element));

		return organizations;
	}

	private search(): SearchElement[] {
		const result = new Array<SearchElement>();
		const queue = this.initSearch();

		while (queue.length > 0) {
			const current = queue.shift();

			if (current && this.shouldContinueSearch(current.depth)) {
				this.visit(current, queue);
				result.push(current);
			}
		}

		return result;
	}

	private initSearch(): SearchElement[] {
		const result = new Array<SearchElement>();
		const root = this.document.querySelectorAll('manifest > organizations > organization > item > item');

		root.forEach((element) => {
			result.push({
				depth: 0,
				path: this.getElementIdentifier(element),
				element,
			});
		});

		return result;
	}

	private shouldContinueSearch(depth: number): boolean {
		const shouldContinueSearch = depth <= this.options.maxSearchDepth;

		return shouldContinueSearch;
	}

	private visit(element: SearchElement, queue: SearchElement[]): void {
		element.element.querySelectorAll(':scope > item').forEach((child) => {
			queue.push({
				depth: element.depth + 1,
				path: `${element.path}${this.options.pathSeparator}${this.getElementIdentifier(child)}`,
				element: child,
			});
		});
	}

	private createOrganizationProps(element: SearchElement): CommonCartridgeOrganizationProps {
		const title = this.getElementTitle(element.element);
		const identifier = this.getElementIdentifier(element.element);
		const identifierRef = this.getElementIdentifierRef(element.element);
		const isResource = identifierRef !== '';
		const resourcePath = isResource ? this.getResourcePath(identifierRef) : '';
		const resourceType = isResource ? this.getResourceType(identifierRef) : '';
		const isInlined = isResource && !resourcePath;

		return {
			path: element.path,
			pathDepth: element.depth,
			identifier,
			identifierRef,
			title,
			isResource,
			isInlined,
			resourcePath,
			resourceType,
		};
	}

	private getElementIdentifier(element: Element): string {
		const identifier = element.getAttribute('identifier') || '';

		return identifier;
	}

	private getElementIdentifierRef(element: Element): string {
		const identifierRef = element.getAttribute('identifierref') || '';

		return identifierRef;
	}

	private getElementTitle(element: Element): string {
		const title = element.querySelector('title')?.textContent ?? '';

		return title;
	}

	private getResourcePath(identifierRef: string): string {
		const path =
			this.document
				.querySelector(`manifest > resources > resource[identifier="${identifierRef}"] > file`)
				?.getAttribute('href') || '';

		return path;
	}

	private getResourceType(identifierRef: string): string {
		const type =
			this.document
				.querySelector(`manifest > resources > resource[identifier="${identifierRef}"]`)
				?.getAttribute('type') || '';

		return type;
	}
}
