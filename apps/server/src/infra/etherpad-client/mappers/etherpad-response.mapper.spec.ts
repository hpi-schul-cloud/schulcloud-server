import { EtherpadResponseMapper } from './etherpad-response.mapper';

describe('EtherpadResponseMapper', () => {
	const errorMessage = new Error('Etherpad session is missing required properties');

	describe('mapEtherpadSessionToSession', () => {
		describe('when etherpadSession is valid', () => {
			it('should return session', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 'groupID', authorID: 'authorID', validUntil: 123456789 };

				const result = EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession]);

				expect(result).toEqual({
					id: etherpadId,
					groupId: 'groupID',
					authorId: 'authorID',
					validUntil: 123456789,
				});
			});
		});

		describe('when etherpadSession is undefined', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = undefined;

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is null', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = null;

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is empty object', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = {};

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is not an object', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = 'etherpadSession';

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is missing required properties', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 'groupID', authorID: 'authorID' };

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is missing required property valid until', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 'groupID', authorID: 'authorID' };

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is missing required property authorID', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 'groupID', validUntil: 123456789 };

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when etherpadSession is missing required property groupID', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { authorID: 'authorID', validUntil: 123456789 };

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					errorMessage
				);
			});
		});

		describe('when groupId is not a string', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 123, authorID: 'authorID', validUntil: 123456789 };
				const error = new Error('Type is not a string');

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					error
				);
			});
		});

		describe('when authorId is not a string', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 'groupID', authorID: 123, validUntil: 123456789 };
				const error = new Error('Type is not a string');

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					error
				);
			});
		});

		describe('when validUntil is not a number', () => {
			it('should throw error', () => {
				const etherpadId = 'etherpadId';
				const etherpadSession = { groupID: 'groupID', authorID: 'authorID', validUntil: '123456789' };
				const error = new Error('Type is not a number');

				expect(() => EtherpadResponseMapper.mapEtherpadSessionToSession([etherpadId, etherpadSession])).toThrowError(
					error
				);
			});
		});
	});

	describe('mapEtherpadSessionsToSessions', () => {
		describe('when etherpadSessions is valid', () => {
			it('should return sessions', () => {
				const etherpadSessions = {
					etherpadId1: { groupID: 'groupID1', authorID: 'authorID1', validUntil: 123456789 },
					etherpadId2: { groupID: 'groupID2', authorID: 'authorID2', validUntil: 123456789 },
				};

				const result = EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions);

				expect(result).toEqual([
					{
						id: 'etherpadId1',
						groupId: 'groupID1',
						authorId: 'authorID1',
						validUntil: 123456789,
					},
					{
						id: 'etherpadId2',
						groupId: 'groupID2',
						authorId: 'authorID2',
						validUntil: 123456789,
					},
				]);
			});
		});

		describe('when etherpadSessions is not an object', () => {
			it('should throw error', () => {
				const etherpadSessions = 'etherpadSessions';
				const error = new Error('Type is not an object');

				expect(() => EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions)).toThrowError(error);
			});
		});

		describe('when etherpadSessions is empty object', () => {
			it('should return empty array', () => {
				const etherpadSessions = {};

				const result = EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions);

				expect(result).toEqual([]);
			});
		});

		describe('when etherpadSessions is null', () => {
			it('should throw error', () => {
				const etherpadSessions = null;
				const error = new Error('Type is not an object');

				expect(() => EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions)).toThrowError(error);
			});
		});

		describe('when etherpadSessions is undefined', () => {
			it('should throw error', () => {
				const etherpadSessions = undefined;
				const error = new Error('Type is not an object');

				expect(() => EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions)).toThrowError(error);
			});
		});

		describe('when etherpadSession value is null', () => {
			it('should not include session in result', () => {
				const etherpadSessions = {
					etherpadId1: { groupID: 'groupID1', authorID: 'authorID1', validUntil: 123456789 },
					etherpadId2: null,
				};

				const result = EtherpadResponseMapper.mapEtherpadSessionsToSessions(etherpadSessions);

				expect(result).toEqual([
					{
						id: 'etherpadId1',
						groupId: 'groupID1',
						authorId: 'authorID1',
						validUntil: 123456789,
					},
				]);
			});
		});
	});
});
