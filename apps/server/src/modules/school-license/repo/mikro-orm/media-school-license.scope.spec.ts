import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSchoolLicenseScope } from './media-school-license.scope';
import { SchoolLicenseType } from '../../enum';

describe(MediaSchoolLicenseScope.name, () => {
	let scope: MediaSchoolLicenseScope;

	beforeEach(() => {
		scope = new MediaSchoolLicenseScope();
		scope.allowEmptyQuery(true);
		jest.useFakeTimers();
		jest.setSystemTime(new Date());
	});

	describe('bySchoolId', () => {
		describe('when id is defined', () => {
			const setup = () => {
				const schoolId = new ObjectId().toHexString();

				return { schoolId };
			};

			it('should add query', () => {
				const { schoolId } = setup();

				scope.bySchoolId(schoolId);

				expect(scope.query).toEqual({ school: schoolId });
			});
		});

		describe('when id is not defined', () => {
			it('should add query', () => {
				scope.bySchoolId(undefined);

				expect(scope.query).toEqual({});
			});
		});
	});

	describe('bySchoolLicenseType', () => {
		describe('when type is defined', () => {
			const setup = () => {
				const type = SchoolLicenseType.MEDIA_LICENSE;

				return { type };
			};

			it('should add query', () => {
				const { type } = setup();

				scope.bySchoolLicenseType(type);

				expect(scope.query).toEqual({ type });
			});
		});

		describe('when type is not defined', () => {
			it('should add query', () => {
				scope.bySchoolId(undefined);

				expect(scope.query).toEqual({});
			});
		});
	});
});
