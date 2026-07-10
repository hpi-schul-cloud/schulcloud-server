import { ClassRootType } from './class-root-type';
import { InternalClassDto, isGroupClassDto } from './internal-class.dto';

const buildDto = (type: ClassRootType): InternalClassDto<unknown> =>
	new InternalClassDto({
		id: 'some-id',
		type,
		name: 'Test',
		teacherNames: [],
		studentCount: 0,
		original: {},
	});

describe('isGroupClassDto', () => {
	it('returns true when type is GROUP', () => {
		const dto = buildDto(ClassRootType.GROUP);
		expect(isGroupClassDto(dto)).toBe(true);
	});

	it('returns false when type is CLASS', () => {
		const dto = buildDto(ClassRootType.CLASS);
		expect(isGroupClassDto(dto)).toBe(false);
	});
});
