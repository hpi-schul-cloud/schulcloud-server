const service = require('feathers-mongoose');
const {
	BadRequest,
	Forbidden,
	NotFound,
} = require('@feathersjs/errors');
const hooks = require('../hooks');
const { warn } = require('../../../logger/index');

const {
	createUserWithRole,
} = require('../hooks/helpers');
const {
	getBasic,
	patchTeam,
	getSessionUser,
} = require('../helpers');
const {
	isArray,
	isArrayWithElement,
	isString,
	isDefined,
	isUndefined,
	isSameId,
} = require('../hooks/collection');

class AdminOverview {
	constructor(options) {
		this.options = options || {};
		this.docs = {};

		if (process.env.SC_SHORT_TITLE === undefined) {
			warn('SC_SHORT_TITLE is not defined.');
		}
	}

	static testIfUserByRoleExist(team, roleId) {
		return team.userIds.some(user => isSameId(user.role, roleId));
	}

	static removeMemberBySchool(team, schoolId) {
		return team.userIds.filter(user => !isSameId(user.schoolId, schoolId));
	}

	static getMembersBySchool(team, schoolId) {
		return team.userIds.filter(user => isSameId(user.schoolId, schoolId));
	}

	static getIsOwnerStats(ref, sessionUser, team) {
		const selectedRole = ref.findRole('name', 'teamowner', '_id');
		const ownerExist = AdminOverview.testIfUserByRoleExist(team, selectedRole);
		const { schoolId } = sessionUser;
		const isOwnerSchool = isSameId(schoolId, team.schoolId);
		return {
			ownerExist,
			isOwnerSchool,
			schoolId,
			selectedRole,
		};
	}

	static getKeys(obj, keys) {
		return keys.reduce((newObj, key) => {
			newObj[key] = obj[key];
			return newObj;
		}, {});
	}

	static mapped(teams, sessionSchoolId) {
		return teams.data.map((team) => {
			const createdAtMySchool = isSameId(team.schoolId, sessionSchoolId);
			const hasMembersOfOtherSchools = team.schoolIds.length > 1;
			let schoolMembers = AdminOverview.getMembersBySchool(team, sessionSchoolId);
			const ownerExist = team.userIds.some(user => user.role.name === 'teamowner'); // role is populated

			schoolMembers = schoolMembers.map((m) => {
				const obj = {
					role: m.role.name,
					user: AdminOverview.getKeys(m.userId, ['roles', '_id', 'firstName', 'lastName']),
				};
				return obj;
			});

			schoolMembers = schoolMembers.map((m) => {
				m.user.roles = (m.user.roles || []).map(role => role.name);
				return m;
			});

			return {
				// todo ownerExist -> ref role needed
				membersTotal: team.userIds.length,
				name: team.name,
				_id: team._id,
				color: team.color,
				desciption: team.desciption,
				createdAtMySchool,
				hasMembersOfOtherSchools,
				createdAt: team.createdAt,
				ownerExist,
				//      ownerSchool:team.schoolId.name,
				schools: team.schoolIds.map(s => AdminOverview.getKeys(s, ['name', '_id'])),
				schoolMembers,
			};
		});
	}

	find(params) {
		return getSessionUser(this, params).then((sessionUser) => {
			const { schoolId } = sessionUser;
			return this.app.service('teams')
				.find({
					query: {
						schoolIds: schoolId,
						// userIds: { $elemMatch: { schoolId } },
						$populate: [{ path: 'userIds.role' }, {
							path: 'userIds.userId',
							populate: { path: 'roles' },
						}, 'schoolIds'], // schoolId
					},
				})
				.then(teams => AdminOverview.mapped(teams, schoolId))
				.catch((err) => {
					throw new BadRequest('Can not execute team find.', err);
				});
		});
	}

	/**
     * If team is create at this school and owner if not exist,
     * the school admin can set a new owner for this team.
     * If school is created from other school and *userId is not set*,
     * it remove all users from own school.
     * @param {String} teamId
     * @param {Object} data data.userId
     * @param {Object} params
     */
	patch(teamId, { userId }, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const {
				ownerExist,
				isOwnerSchool,
				selectedRole,
				schoolId,
			} = AdminOverview.getIsOwnerStats(ref, sessionUser, team);
			// const userId = data.userId;
			let { userIds } = team;

			if (isOwnerSchool && isDefined(userId)) {
				userIds.push(createUserWithRole(ref, { userId, schoolId, selectedRole: 'teamowner' }));
			} else if (!isOwnerSchool && isUndefined(userId)) {
				userIds = AdminOverview.removeMemberBySchool(team, schoolId);
			} else {
				throw new BadRequest('Wrong inputs.');
			}

			return patchTeam(this, teamId, { userIds }, params);
		});
	}

	/**
     * If team is created at own school, it remove it.
     * @param {*} teamId
     * @param {*} params
     */
	remove(teamId, params) {
		return getBasic(this, teamId, params).then(([ref, sessionUser, team]) => {
			const { isOwnerSchool } = AdminOverview.getIsOwnerStats(ref, sessionUser, team);
			if (isUndefined(isOwnerSchool)) {
				throw new Forbidden('You have not the permission.');
			}
			return this.app.service('teams').remove(teamId);
		});
	}


	/**
    * Contact Owner part
    */

	static getOwner(team, ownerRoleId) {
		return team.userIds.find(user => isSameId(user.role, ownerRoleId));
	}

	static formatText(text) {
		// todo
		return text;
	}

	static getRestrictedQuery(teamIds, schoolId) {
		let query = teamIds.map(_id => ({ _id }));
		query = { $or: query, $populate: [{ path: 'userIds.userId' }] };
		query.schoolIds = schoolId;
		return { query };
	}

	/**
     * Over this services method can administrators can send message for school teams.
     * It has a batch logic to send the same message to different teams.
     * This message contact the owner of this teams over his email.
     * @param {Object::{message:String,teamIds:String||Array::String}} data
     * @param {*} params
     */
	create({ message, teamIds }, params) {
		//  const message = data.message;
		//  let teamIds = data.teamIds;

		const teamService = this.app.service('/teams');

		if (isUndefined([teamIds, message], 'OR')) {
			throw new BadRequest('Missing parameter');
		}
		if (!isArray(teamIds)) {
			// eslint-disable-next-line no-param-reassign
			teamIds = [teamIds];
		}
		if (teamIds.length <= 0 || !isString(message)) {
			throw new BadRequest('Wrong value.');
		}

		return Promise.all(
			[getSessionUser(this, params), hooks.teamRolesToHook(this)],
		).then(([{ schoolId }, ref]) => {
			teamService
				.find((AdminOverview.getRestrictedQuery(teamIds, schoolId)))
				.then((teams) => {
					teams = teams.data;
					if (!isArrayWithElement(teams)) {
						throw new NotFound('No team found.');
					}

					const subject = `${process.env.SC_SHORT_TITLE}: Team-Anfrage`;
					const mailService = this.app.service('/mails');
					const ownerRoleId = ref.findRole('name', 'teamowner', '_id');
					const emails = teams.reduce((stack, team) => {
						const owner = AdminOverview.getOwner(team, ownerRoleId);
						if (isDefined(owner.userId.email)) {
							stack.push(owner.userId.email);
						}
						return stack;
					}, []);
					const content = {
						text: AdminOverview.formatText(message)
								|| 'No alternative mailtext provided. Expected: HTML Template Mail.',
						html: '',
					};

					const waits = emails.map(email => mailService.create({ email, subject, content })
						.then(res => res.accepted[0])
						.catch(err => `Error: ${err.message}`));

					return Promise.all(waits)
						.then(values => values)
						.catch(err => err);
				}).catch((err) => {
					throw err;
				});
		}).catch((err) => {
			warn(err);
			throw new BadRequest('It exists no teams with access rights, to send this message.');
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = AdminOverview