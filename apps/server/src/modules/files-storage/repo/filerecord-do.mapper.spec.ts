import { fileRecordTestFactory } from '../domain';
import { fileRecordDOMapper } from './filerecord-do.mapper';
import { FileRecordEntity } from './filerecord.entity';

describe('filerecord-do.mapper', () => {
	describe('createEntity', () => {
		describe('when a new fileRecord is passed', () => {
			const setup = () => {
				const fileRecord = fileRecordTestFactory.build();

				return { fileRecord };
			};

			it('should be created a valid fileRecord entity instance with id and properties', () => {
				const { fileRecord } = setup();

				const fileRecordEntity = fileRecordDOMapper.createEntity(fileRecord);

				const props = fileRecord.getProps();
				expect(fileRecordEntity).toBeInstanceOf(FileRecordEntity);
				expect(fileRecordEntity.id).toEqual(fileRecord.id);
				expect(fileRecordEntity.name).toEqual(props.name);
			});
		});
	});
});
