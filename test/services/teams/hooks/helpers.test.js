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
});
