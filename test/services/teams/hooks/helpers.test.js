const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const { BadRequest } = require('feathers-errors');
const { ifSuperhero, getSessionUser, updateMissingDataInHookForCreate,
	isAcceptWay, getTeam, arrayRemoveAddDiffs, getTeamUsers,
	populateUsersForEachUserIdinHookData } = require('../../../../src/services/teams/hooks/helpers.js');

describe('hook helpers', () => {
	describe('ifSuperhero', () => {
		it('should return true if one of the given roles is superhero', () => {
			const roles = [
				{ name: 'user' },
				{ name: 'teacher' },
				{ name: 'superhero' },
			];
			expect(ifSuperhero(roles)).to.equal(true);
			expect(ifSuperhero(['superhero', 'admin'])).to.equal(true);
		});

		it('should return false otherwise', () => {
			expect(ifSuperhero([])).to.equal(false);
			expect(ifSuperhero({})).to.equal(false);
			expect(ifSuperhero(['admin', 'lehrer'])).to.equal(false);
			expect(ifSuperhero([
				{ name: 'admin' },
				{ name: 'schueler' },
			])).to.equal(false);
		});
	});

	describe('arrayRemoveAddDiffs', () => {
		it.skip('should work for empty arrays', () => {
			expect(arrayRemoveAddDiffs([], [])).to.equal({add: [], remove: []});
		});

		it('should work for plain arrays', () => {
			expect(arrayRemoveAddDiffs([1], [2])).to.deep.equal({add: [2], remove: [1]});
			expect(arrayRemoveAddDiffs([1, 2, 3], [2, 4])).to.deep.equal({add: [4], remove: [1, 3]});
			expect(arrayRemoveAddDiffs(['foo', 'bar'], ['foo', 'baz', 'bar'])).to.deep.equal({add: ['baz'], remove: []});
			expect(arrayRemoveAddDiffs(['foo', 'bar'], ['bar'])).to.deep.equal({add: [], remove: ['foo']});
		});

		it('should ignore duplicate values', () => {
			expect(arrayRemoveAddDiffs([1, 1, 2], [1, 2])).to.deep.equal({add: [], remove: []});
			expect(arrayRemoveAddDiffs([1, 1, 2], [1, 1, 1, 1, 3])).to.deep.equal({add: [3], remove: [2]});
		});

		it('should work on huge arrays', () => {
			const arr = new Array(Math.pow(2, 15)).fill(1);
			const arr2 = Array.from(arr);
			arr2.push(2);
			expect(arrayRemoveAddDiffs(arr, arr2)).to.deep.equal({add: [2], remove: []});
		});

		it('should use a provided key to compare elements', () => {
			const original = [
				{ name: 'foo' },
				{ name: 'bar', data: 1 },
			];
			const changed = [
				{ name: 'baz' },
				{ name: 'bar', data: 2 },
			];
			const expected = {
				add: [{ name: 'baz' }],
				remove: [{ name: 'foo' }],
			};
			expect(arrayRemoveAddDiffs(original, changed, 'name')).to.deep.equal(expected);
		});

		it('should work on lists of ObjectIds', () => {
			const id1 = new ObjectId();
			const id2 = new ObjectId();
			const id3 = new ObjectId();

			const original = [
				{ _id: id1 },
				{ _id: id2 },
			];
			const changed = [
				{ _id: id1 },
				{ _id: id3 },
			];
			const expected = {
				add: [{ _id: id3 }],
				remove: [{ _id: id2 }],
			};
			expect(arrayRemoveAddDiffs(original, changed, '_id')).to.deep.equal(expected);
		});
	});
});
