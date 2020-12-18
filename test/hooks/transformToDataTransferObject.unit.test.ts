import { expect } from 'chai';
import mongooseImport from 'mongoose'; 
const { ObjectId } = mongooseImport.Types;

import { transformToDataTransferObject } from '../../src/hooks/transformToDataTransferObject';

describe('transform to data transfer object hook', () => {
	it('when the result contains strings, then it does nothing', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(resultContext).to.deep.equal(context);
	});

	it('when the result contains an objectId, then it transforms the id to a string', () => {
		const context = {
			result: {
				_id: new ObjectId(),
				firstname: 'Harry',
				lastname: 'Dresden',
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result._id).equal('string');
	});

	it('when the result contain a Date object, then it transforms the date to a string', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				nextDangerousSituation: new Date(),
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.nextDangerousSituation).to.equal('string');
	});

	it('when the result contains a nested object containing an Id, then it iterates over the nested object as well', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				bestFriend: {
					_id: new ObjectId(),
					firstname: 'Michael',
					lastname: 'Carpenter',
				},
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.bestFriend._id).to.equal('string');
	});

	it('when the result contains a nested object containing a date, then it iterates over the nested object as well', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				nextAppointment: {
					name: 'Interview with Susan',
					date: new Date(),
					comments: 'dont tell her anything',
				},
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.nextAppointment.date).to.equal('string');
	});

	it('when the result contains a an Array of Ids, then it ransforms the array elements as well', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				enemies: [new ObjectId()],
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.enemies[0]).to.equal('string');
	});

	it('when the result contains a an Array of Dates, then it transforms the array elements as well', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				deadlines: [new Date()],
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.deadlines[0]).to.equal('string');
	});

	it('when the result contains a an Array of Strings, then it does nothing', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				clients: ['CPD', 'Monica'],
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(resultContext).to.deep.equal(context);
	});

	it('when the result contains a an Array of Objects, then it transforms the array elements as well', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				enemies: [
					{
						_id: new ObjectId(),
						name: 'Nicodemus',
					},
				],
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.enemies[0]._id).to.equal('string');
	});

	it('when the result contains a an Array of Arrays, then it transforms the array elements as well', () => {
		const context = {
			result: {
				_id: '0123456789abcdef01234567',
				firstname: 'Harry',
				lastname: 'Dresden',
				BookCase: [[new ObjectId()]],
			},
		};

		const resultContext = transformToDataTransferObject(context);

		expect(typeof resultContext.result.BookCase[0][0]).to.equal('string');
	});
});
