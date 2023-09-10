import { ClassSourceOptions } from '../class-source-options.do';

describe(ClassSourceOptions.name, () => {
	describe('constructor', () => {
		describe('When a contructor is called', () => {
			const setup = () => {
				const domainObject = new ClassSourceOptions({ tspUid: '12345' });

				return { domainObject };
			};

			it('should create empty object', () => {
				const domainObject = new ClassSourceOptions({});

				expect(domainObject).toEqual(expect.objectContaining({}));
			});

			it('should contain valid tspUid ', () => {
				const { domainObject } = setup();

				const classSourceOptionsDo: ClassSourceOptions = new ClassSourceOptions(domainObject);

				expect(classSourceOptionsDo.tspUid).toEqual(domainObject.tspUid);
			});
		});
	});
	describe('getters', () => {
		describe('When getters are used', () => {
			it('getters should return proper value', () => {
				const props = {
					tspUid: '12345',
				};

				const classSourceOptionsDo = new ClassSourceOptions(props);
				const gettersValues = {
					tspUid: classSourceOptionsDo.tspUid,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
