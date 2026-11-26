import { Injectable } from '@nestjs/common';
import { type BoardImportSourceDefinition } from '../interface';

// A host name in lowercase, or "*." plus a domain for all its subdomains. The last label starts with a letter,
// so an IPv4 address does not match.
const HOST_ENTRY_PATTERN = /^(\*\.)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]([a-z0-9-]*[a-z0-9])?$/;

// A source module puts its definition here when the app starts. Thus the import knows only the imported sources.
@Injectable()
export class BoardImportSourceRegistryService {
	private readonly definitions = new Map<string, BoardImportSourceDefinition>();

	public registerSource(definition: BoardImportSourceDefinition): void {
		if (this.definitions.has(definition.type)) {
			throw new Error(`The import source "${definition.type}" is registered already`);
		}
		// The check is here, so that no source can register a host list that is not checked.
		if (!definition.boardHosts.every((entry) => HOST_ENTRY_PATTERN.test(entry))) {
			throw new Error(`The import source "${definition.type}" has a board host that is not valid`);
		}

		this.definitions.set(definition.type, definition);
	}

	public findByType(type: string): BoardImportSourceDefinition | undefined {
		const definition = this.definitions.get(type);

		return definition;
	}

	public getAll(): BoardImportSourceDefinition[] {
		const definitions = [...this.definitions.values()];

		return definitions;
	}
}
