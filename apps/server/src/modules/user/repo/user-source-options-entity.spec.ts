import { UserSourceOptionsEntity } from './user-source-options-entity';

describe(UserSourceOptionsEntity.name, () => {
	describe('constructor', () => {
		describe('When a contructor is called', () => {
			const setup = () => {
				const entityProps = { tspUid: 'tspUid' };

				return { entityProps };
			};

			it('should contain valid tspUid ', () => {
				const { entityProps } = setup();

				const userSourceOptionsEntity: UserSourceOptionsEntity = new UserSourceOptionsEntity(entityProps);

				expect(userSourceOptionsEntity.tspUid).toEqual(entityProps.tspUid);
			});
		});
	});
});
