import { createMock } from '@golevelup/ts-jest';
import { type BoardImportSourceReader } from '../interface';
import { BoardImportSourceReaderRegistryService } from './board-import-source-reader-registry.service';

describe(BoardImportSourceReaderRegistryService.name, () => {
	const setup = () => {
		const registry = new BoardImportSourceReaderRegistryService();
		const reader = createMock<BoardImportSourceReader>({ type: 'test-source' });
		const otherType = 'other-source';

		return { registry, reader, otherType };
	};

	describe('findByType', () => {
		describe('when a reader with the type is registered', () => {
			it('should return the reader', () => {
				const { registry, reader } = setup();
				registry.registerReader(reader);

				const result = registry.findByType(reader.type);

				expect(result).toBe(reader);
			});
		});

		describe('when no reader with the type is registered', () => {
			it('should return undefined', () => {
				const { registry, reader, otherType } = setup();
				registry.registerReader(reader);

				const result = registry.findByType(otherType);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('registerReader', () => {
		describe('when a reader with the same type is registered already', () => {
			it('should throw an error', () => {
				const { registry, reader } = setup();
				registry.registerReader(reader);

				expect(() => registry.registerReader(createMock<BoardImportSourceReader>({ type: reader.type }))).toThrow(
					Error
				);
			});
		});
	});
});
