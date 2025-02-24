import { UserSourceOptions } from './user-source-options.do';

describe(UserSourceOptions.name, () => {
	describe('constructor', () => {
		describe('When a constructor is called', () => {
			const setup = () => {
				const domainObject = new UserSourceOptions({ tspUid: '12345' });

				return { domainObject };
			};

			it('should create empty object', () => {
				const domainObject = new UserSourceOptions({});

				expect(domainObject).toEqual(expect.objectContaining({}));
			});

			it('should contain valid tspUid ', () => {
				const { domainObject } = setup();

				const userSourceOptionsDo: UserSourceOptions = new UserSourceOptions(domainObject);

				expect(userSourceOptionsDo.tspUid).toEqual(domainObject.tspUid);
			});
		});
	});
	describe('getters', () => {
		describe('When getters are used', () => {
			it('getters should return proper value', () => {
				const props = {
					tspUid: '12345',
				};

				const userSourceOptionsDo = new UserSourceOptions(props);
				const gettersValues = {
					tspUid: userSourceOptionsDo.tspUid,
				};

				expect(gettersValues).toEqual(props);
			});
		});
	});
});
