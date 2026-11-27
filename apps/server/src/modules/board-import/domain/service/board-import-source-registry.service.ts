import { Injectable } from '@nestjs/common';
import { type BoardImportSourceDefinition } from '../interface';
import { isHostName, SUBDOMAIN_PREFIX } from './board-import-host-name';

// A source module puts its definition here when the app starts. Thus the import knows only the imported sources.
@Injectable()
export class BoardImportSourceRegistryService {
	private readonly definitions = new Map<string, BoardImportSourceDefinition>();

	public registerSource(definition: BoardImportSourceDefinition): void {
		if (this.definitions.has(definition.type)) {
			throw new Error(`The import source "${definition.type}" is registered already`);
		}
		// The check is here, so that no source can register a host list that is not checked.
		const invalidHost = definition.boardHosts.find((entry) => !this.isHostEntry(entry));
		if (invalidHost !== undefined) {
			throw new Error(`The import source "${definition.type}" has the board host "${invalidHost}", which is not valid`);
		}

		// A frozen copy, so that a later change of the source or its config cannot add a host that is not checked.
		const storedDefinition: BoardImportSourceDefinition = Object.freeze({
			type: definition.type,
			boardHosts: Object.freeze([...definition.boardHosts]),
			switchKey: definition.switchKey,
		});
		this.definitions.set(definition.type, storedDefinition);
	}

	public findByType(type: string): BoardImportSourceDefinition | undefined {
		const definition = this.definitions.get(type);

		return definition;
	}

	public getAll(): BoardImportSourceDefinition[] {
		const definitions = [...this.definitions.values()];

		return definitions;
	}

	private isHostEntry(entry: string): boolean {
		const host = entry.startsWith(SUBDOMAIN_PREFIX) ? entry.slice(SUBDOMAIN_PREFIX.length) : entry;
		const result = isHostName(host);

		return result;
	}
}
