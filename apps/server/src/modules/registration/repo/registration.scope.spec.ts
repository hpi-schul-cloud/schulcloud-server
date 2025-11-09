import { ObjectId } from '@mikro-orm/mongodb';
import { RegistrationScope } from './registration.scope';

describe(RegistrationScope.name, () => {
	let scope: RegistrationScope;

	beforeEach(() => {
		scope = new RegistrationScope();
		scope.allowEmptyQuery(true);
	});

	describe('byRegistrationHash', () => {
		describe('when hash is undefined', () => {
			it('should not add query', () => {
				scope.byRegistrationHash(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when hash is defined', () => {
			it('should add query', () => {
				scope.byRegistrationHash('someHashValue');

				expect(scope.query).toEqual({ registrationHash: 'someHashValue' });
			});
		});
	});

	describe('byRoomId', () => {
		describe('when roomId is undefined', () => {
			it('should not add query', () => {
				scope.byRoomId(undefined);

				expect(scope.query).toEqual({});
			});
		});

		describe('when roomId is defined', () => {
			const setup = () => {
				return {
					roomId: new ObjectId().toHexString(),
				};
			};

			it('should add query', () => {
				const { roomId } = setup();

				scope.byRoomId(roomId);

				expect(scope.query).toEqual({ roomIds: { $in: [roomId] } });
			});
		});
	});
});
