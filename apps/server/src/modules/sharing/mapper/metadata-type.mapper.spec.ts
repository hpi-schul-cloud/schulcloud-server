import { NotImplementedException } from '@nestjs/common';
import { LearnroomTypes } from '@shared/domain';
import { ShareTokenParentType } from '../domainobject/share-token.do';
import { MetadataTypeMapper } from './metadata-type.mapper';

describe('MetadataTypeMapper', () => {
	describe('mapToAlloweMetadataType()', () => {
		it('should return allowed type equal Course', () => {
			const result = MetadataTypeMapper.mapToAlloweMetadataType(ShareTokenParentType.Course);
			expect(result).toBe(LearnroomTypes.Course);
		});
		it('should throw Error', () => {
			const exec = () => {
				MetadataTypeMapper.mapToAlloweMetadataType('' as ShareTokenParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
