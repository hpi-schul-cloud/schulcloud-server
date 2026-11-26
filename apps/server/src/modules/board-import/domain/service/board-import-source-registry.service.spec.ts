import { type BoardImportSourceDefinition } from '../interface';
import { BoardImportSourceRegistryService } from './board-import-source-registry.service';

describe(BoardImportSourceRegistryService.name, () => {
	const setup = () => {
		const registry = new BoardImportSourceRegistryService();
		const definition: BoardImportSourceDefinition = {
			type: 'test-source',
			boardHosts: ['source.example'],
			switchKey: 'TEST_SOURCE_ENABLED',
		};
		const otherDefinition: BoardImportSourceDefinition = {
			type: 'other-source',
			boardHosts: ['other.example'],
			switchKey: 'OTHER_SOURCE_ENABLED',
		};

		return { registry, definition, otherDefinition };
	};

	describe('findByType', () => {
		describe('when a source with the type is registered', () => {
			it('should return the definition', () => {
				const { registry, definition } = setup();
				registry.registerSource(definition);

				const result = registry.findByType(definition.type);

				expect(result).toBe(definition);
			});
		});

		describe('when no source with the type is registered', () => {
			it('should return undefined', () => {
				const { registry, definition, otherDefinition } = setup();
				registry.registerSource(definition);

				const result = registry.findByType(otherDefinition.type);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('getAll', () => {
		describe('when sources are registered', () => {
			it('should return the definitions in the order of the registration', () => {
				const { registry, definition, otherDefinition } = setup();
				registry.registerSource(definition);
				registry.registerSource(otherDefinition);

				const result = registry.getAll();

				expect(result).toEqual([definition, otherDefinition]);
			});
		});
	});

	describe('registerSource', () => {
		describe('when a source with the same type is registered already', () => {
			it('should throw an error', () => {
				const { registry, definition } = setup();
				registry.registerSource(definition);

				expect(() => registry.registerSource({ ...definition })).toThrow(Error);
			});
		});
	});
});
