import { ObjectId } from '@mikro-orm/mongodb';
import { KeyFactory } from './key.factory';

describe('KeyFactory', () => {
	describe('createForUpdate', () => {
		describe('when clock is not passed', () => {
			const setup = () => {
				const params = { docName: new ObjectId().toHexString() };

				return { params };
			};

			it('should return a object that support the interface UniqueKey and clock is not defined', () => {
				const { params } = setup();

				const result = KeyFactory.createForUpdate(params.docName);

				expect(result).toEqual({
					docName: params.docName,
					version: 'v1',
					action: 'update',
					clock: undefined,
				});
			});
		});

		describe('when positive clock number is passed', () => {
			const setup = () => {
				const params = { docName: new ObjectId().toHexString(), clock: 2 };

				return { params };
			};

			it('should return a object that support the interface UniqueKey and pass the clock number', () => {
				const { params } = setup();

				const result = KeyFactory.createForUpdate(params.docName, params.clock);

				expect(result).toEqual({
					docName: params.docName,
					version: 'v1',
					action: 'update',
					clock: params.clock,
				});
			});
		});

		describe('when clock number -1 is passed', () => {
			const setup = () => {
				const params = { docName: new ObjectId().toHexString(), clock: -1 };

				return { params };
			};

			it('should return a object that support the interface UniqueKey and pass the clock number', () => {
				const { params } = setup();

				const result = KeyFactory.createForUpdate(params.docName, params.clock);

				expect(result).toEqual({
					docName: params.docName,
					version: 'v1',
					action: 'update',
					clock: params.clock,
				});
			});
		});

		describe('when clock lower then -1 is passed', () => {
			const setup = () => {
				const params = { docName: new ObjectId().toHexString(), clock: -2 };

				return { params };
			};

			it('should throw an invalid clock number error', () => {
				const { params } = setup();

				expect(() => KeyFactory.createForUpdate(params.docName, params.clock)).toThrowError();
			});
		});
	});

	describe('createForInsert', () => {
		describe('when docName passed', () => {
			const setup = () => {
				const params = { docName: new ObjectId().toHexString() };

				return { params };
			};

			it('should return a object that support the interface UniqueKey', () => {
				const { params } = setup();

				const result = KeyFactory.createForInsert(params.docName);

				expect(result).toEqual({
					docName: params.docName,
					version: 'v1_sv',
					action: undefined,
					clock: undefined,
				});
			});
		});
	});
});
