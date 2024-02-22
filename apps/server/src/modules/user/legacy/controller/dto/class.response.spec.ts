import { ClassResponse } from './class.response';

describe(ClassResponse.name, () => {
	describe('constructor', () => {
		describe('When constructor is called', () => {
			const setup = () => {
				const classResp = {
					name: '1A',
					gradeLevel: 1,
				};

				return {
					classResp,
				};
			};

			it('should create a class by passing required properties', () => {
				const { classResp } = setup();
				const classResponse = new ClassResponse(classResp);

				expect(classResponse.name).toEqual(classResp.name);
				expect(classResponse.gradeLevel).toEqual(classResp.gradeLevel);
			});
		});
	});
});
