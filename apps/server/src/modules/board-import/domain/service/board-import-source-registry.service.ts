import { Injectable } from '@nestjs/common';
import { type BoardImportSourceDefinition } from '../interface';

// A source module puts its definition here when the app starts. Thus the import knows only the imported sources.
@Injectable()
export class BoardImportSourceRegistryService {
	private readonly definitions = new Map<string, BoardImportSourceDefinition>();

	public registerSource(definition: BoardImportSourceDefinition): void {
		if (this.definitions.has(definition.type)) {
			throw new Error(`The import source "${definition.type}" is registered already`);
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
