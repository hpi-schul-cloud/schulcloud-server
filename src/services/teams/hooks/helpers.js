const errors = require('feathers-errors');
const logger = require('winston');
const { set, get } = require('./scope');
const {
    isArray,
    isArrayWithElement,
    isObject,
    isString,
    hasKey,
    isDefined,
    isUndefined,
    isNull,
    createObjectId,
    isObjectId,
    isObjectIdWithTryToCast,
    throwErrorIfNotObjectId,
    bsonIdToString,
    isSameId,
    isFunction
} = require('./collection');

/**
* Test if roles stack is superhero. 
* @helper 
* @requires {$populated roles}
*/
const ifSuperhero = (roles) => {
    let isSuperhero = false;
    if (isArrayWithElement(roles)) {
        const type = typeof roles[0];
        if (isString(type)) {
            isSuperhero = roles.includes('superhero');      //todo: make no sense at the moment roles includes only the ids of the roles
        } else if (isObject(type)) {
            if (isDefined(roles.find(_role => _role.name === 'superhero'))) {
                isSuperhero = true;
            }
        }
    }
    return isSuperhero;
};

/**
* @helper 
* @param {hook} hook 
* @returns {Object::User}
*/
const getSessionUser = hook => {
    return new Promise((resolve, reject) => {
        const sessionUserId = bsonIdToString(hook.params.account.userId);
        const sessionUser = get(hook, 'sessionUser');
        if (isDefined(sessionUser)) {
            if (isUndefined(get(hook, 'isSuperhero')))
                set(hook, 'isSuperhero', ifSuperhero(sessionUser.roles));  //todo : is the logic clear?
            resolve(sessionUser);
        } else {
            hook.app.service('users').get(sessionUserId, {
                query: { $populate: 'roles' }
            }).then(sessionUser => {
                set(hook, 'sessionUser', sessionUser);  //to save the infos from request
                set(hook, 'isSuperhero', ifSuperhero(sessionUser.roles));
                resolve(sessionUser);
            }).catch(err => {
                reject(new errors.NotFound('Can not found user with userId=' + sessionUserId, err));
            });
        }
    }).catch(err => {
        throw new errors.NotFound('User not found.', err);
    });
};

/**
* @helper
* @private
* @param {hook} hook 
* @returns {Object::hook}
*/
const addDefaultFilePermissions = (hook) => {
    if (isUndefined(hook.data) || isUndefined(hook.teamroles))
        return hook;

    hook.data.filePermission = [];

    hook.teamroles.forEach(_role => {
        const refId = _role._id;
        const refPermModel = 'role';
        hook.data.filePermission.push({ refId, refPermModel });
    });

    return hook;
};

/**
 * @helper
 * @param {hook} hook 
 * @param {Object::User} sessionUser 
 * @return {Object::hook.data} 
 */
const updateMissingDataInHookForCreate = (hook, sessionUser) => {
    const userId = bsonIdToString(sessionUser._id);
    const schoolId = bsonIdToString(sessionUser.schoolId);

    const index = hook.data.userIds.indexOf(userId);
    const value = createUserWithRole(hook, userId, 'teamowner');
    index === -1 ? hook.data.userIds.push(value) : hook.data.userIds[index] = value;

    //add team flag
    hook.data.features = ['isTeam'];
    addDefaultFilePermissions(hook);

    hook.data.schoolIds = [schoolId];

    return hook.data;
};

/**
* @helper
* @private
* @param [Object:Valid Moongose Response from find mongooseResponse] 
* @returns {Promise::res.data[0]}
*/
const extractOne = (mongooseResponse) => {
    if ((mongooseResponse.data || []).length == 1)
        return Promise.resolve(mongooseResponse.data[0]);
    else {
        return Promise.reject(mongooseResponse);
    }
};

/**
 * A function to test if user is valid to pass it.
 * First step for soft test without all information you can try with hook, teamId.
 * Second step if you have all information you must try it with all parameters. 
 * -> Only users that are for this request in the invite list with role=teamexperts
 * @requires hook.data.accept={userId,role}
 * @param {Object::hook} hook 
 * @param {String} teamId 
 * @param {Object::Team} oldTeam 
 * @param {Array::User} users 
 * @return {boolen} - True if user can pass it.
 */
const isAcceptWay = (hook, teamId, oldTeam, users) => {
    if (hasKey(hook, 'data') && hasKey(hook.data, 'accept') && isSameId(hook.data.accept.teamId, teamId)) {
        //todo: softtest
        //only expert role can do this
        const acceptUserId = hook.data.accept.userId;
        if (isDefined(oldTeam) && isDefined(users) && isDefined(acceptUserId)) {
            //try the second test that user must be in invite
            const addingUser = users.find(_user => isSameId(_user._id, acceptUserId));
            const addingTeamUser = hook.data.userIds.find(_user => isSameId(_user.userId, acceptUserId));
            //todo add addingUser role ==== 'expert' test
            if (isUndefined(addingUser) || isUndefined(addingTeamUser) )
                return false;

            let bool = false;
            oldTeam.invitedUserIds.map(inv => {
                if (isDefined(inv.email) && 
                    ['teamexpert','teamadministrator'].includes(inv.role) && 
                    addingUser.email === inv.email && 
                    inv.role===hook.findRole('_id',addingTeamUser.role,'name')) {
                        bool = true;
                }
            });
            return bool;

        } else {
            return true;
        }
    }
    return false;
};

/**
* @helper
* @requires function::extractOne
* @param hook hook
* @returns Promise::Object::team
*/
const getTeam = (hook) => {
    return new Promise((resolve, reject) => {
        const method = hook.method;
        const teamId = hook.id || (hook.result || {})._id || hook.teamId || get(hook, 'teamId');
        const sessionUserId = bsonIdToString(hook.params.account.userId);
        const restrictedMatch = { $elemMatch: { userId: sessionUserId } };
        const teamsService = hook.app.service('teams');

        const resolveIt = data => {
            set(hook, 'team', data);    //set it for later use 
            resolve(data);
        };

        if (isDefined(get(hook, 'team'))) {
            resolveIt(get(hook, 'team'));
        } else if (method === 'create') {
            resolveIt(hook.data);
        } else if (teamId) {
            const query = isAcceptWay(hook, teamId) ? { _id: teamId } : { _id: teamId, userIds: restrictedMatch };
            teamsService.find({ query }).then(_teams => {
                extractOne(_teams).then(_team => {
                    resolveIt(_team);
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(new errors.NotFound('Can not found team with teamId=' + teamId, err));
            });
        } else if (method === 'find') {
            teamsService.find({
                query: { userIds: restrictedMatch }
            }).then(_teams => {
                resolveIt(_teams.data);
            }).catch(err => {
                reject(new errors.NotFound('Can not found team for user with userId=' + sessionUserId, err));
            });
        } else {
            throw new errors.NotImplemented('It should not run into this case.');
        }
    }).catch(err => {
        logger.warn(err);
        throw new errors.NotFound('Can not found this team.');
    });
};



/**
*   @helper
*   @private
*   @requires function::hook.findRole Can added over hook function ->todo name
*   @param hook hook
*   @param String userId
*   @param String selectedRole
*/
const createUserWithRole = (hook, userId, selectedRole) => {
    let role;
    if (isUndefined(selectedRole))
        role = hook.findRole('name', 'teammember', '_id'); //roles.teammember;
    else
        role = hook.findRole('name', selectedRole, '_id');

    if (isUndefined(role) || isUndefined(userId))
        throw new errors.BadRequest('Wrong input. (2)');

    return { userId, role };
};

/**
 * return the different between arr1 in relation to arr2 
 * @helper 
 * @private
 * _old_ = [1,2,3] 
 * _new_ = [2,3,4] 
 * @example - _old_ ~ _new_ = [1] => remove item
 * @example - _new_ ~ _old_ = [4] => add item
 * @param Array oldArray
 * @param Array newArray
 * @param String key
 * @return Array 
 */
const arrayDiff = (oldArray, newArray, key) => {
    // try {
    if (!isArrayWithElement(oldArray) || !isArrayWithElement(newArray)) {
        throw new errors.NotAcceptable('Wrong input expect arrays oldArray', { oldArray, newArray });
    }

    const diff = (a1, a2) => {
        if (key === undefined)
            return a1.filter(x => !a2.includes(x));
        else
            return a1.reduce((stack, element) => {
                const v1 = element[key];
                for (let i = 0; i < a2.length; i++) {
                    if (v1 === a2[i][key])
                        return stack;            //if found return without adding
                }
                stack.push(element);              //if not found add element from a1
                return stack;
            }, []);
    };

    return diff(oldArray, newArray);
};

/**
 * @helper
 * @requires function:arrayDiff
 * @param {Array} baseArray 
 * @param {Array} changedArray 
 * @param {String} [key] - optional for objects in arrays
 * @return {Object::{remove:[],add:[]} }
 */
const arrayRemoveAddDiffs = (baseArray, changedArray, key) => {
    return { remove: arrayDiff(baseArray, changedArray, key), add: arrayDiff(changedArray, baseArray, key) };
};

/**
 * @helper 
 * @private
 * @requires function::createUserWithRole
 * @param {Object::hook} hook
 * @param {Array::(stringId||Object::TeamUser||Object::String)} teamUsers 
 * @param {Object::Team}
 */
const mappedInputUserIdsToTeamUsers = (hook, teamUsers, oldTeam) => {
    if (!isArray(teamUsers))
        throw new errors.BadRequest('param teamUsers must be an array', teamUsers);

    const teamownerRoleId = hook.findRole('name', 'teamowner', '_id');
    const teamowner = oldTeam.userIds.find(_user => isSameId(_user.role, teamownerRoleId));

    if (isUndefined(teamowner))
        throw new errors.NotAcceptable('No teamowner found for this team.');

    return teamUsers.map((e) => {
        let role, userId;
        //userId
        if (hasKey(e, 'userId'))
            userId = bsonIdToString(e.userId);

        if (isObjectId(e) || isString(e))
            userId = bsonIdToString(e);

        //teamowner role can not repatched at the moment todo: later test if any other has this role, after map 
        if (isSameId(teamowner.userId, userId))
            return { userId, role: teamownerRoleId };

        //roleId
        if (hasKey(e, 'role')) {
            if (isObjectIdWithTryToCast(e.role))
                role = e.role;
            else
                role = hook.findRole('name', e.role, '_id');
        } else
            role = hook.findRole('name', 'teammember', '_id');

        role = bsonIdToString(role);



        if (isUndefined(userId) || isUndefined(role))
            throw new errors.BadRequest('Can not mapped userIds to teamUsers', { userId, role });

        return { userId, role };
    });
};

/**
 * @helper
 * @private
 * @param {Array::teamUser} teamUsers 
 * @param {Array||String} userIds 
 * @return {Array::teamUser}
 */
const removeTeamUsers = (teamUsers, userIds) => {
    if (isString(userIds))
        userIds = [userIds];

    if (!isArrayWithElement(userIds))
        return teamUsers;

    return teamUsers.reduce((list, teamUser) => {
        if (!userIds.includes(teamUser.userId))
            list.push(teamUser);
        return list;
    }, []);
};

/**
 * Remove all elements if they are not in team schools.
 * @helper
 * @private
 * @requires function::removeTeamUsers
 * @param {Array::String::ObjectId::schools} schoolIds 
 * @param {Array::TeamUser} teamUsers 
 * @param {Array::User} users 
 * @return {Array::TeamUser}
 */
const removeNotValidUsersBySchoolIds = (schoolIds, teamUsers, users) => {
    let removeList = [];
    schoolIds = bsonIdToString(schoolIds);

    teamUsers.map(teamUser => {
        const user = users.find(_user => isSameId(_user._id, teamUser.userId));
        const schoolId = bsonIdToString(user.schoolId);
        if (schoolIds.includes(schoolId) === false)
            removeList.push(user._id);
    });
    return removeTeamUsers(teamUsers, removeList);
};

const teamOwnerRoleExist = (hook, teamUsers, oldTeam, users) => {
    //todo later
    // const teamownerRoleId = hook.findRole('name', 'teamowner', '_id');
    // remove logic in mappedInputUserIdsToTeamUsers for owner 
    // test if any of this users has the role teamowner 
    // teamowner must have the userRole teacher!
    return teamUsers;
};

/**
 * Remove duplicated users. It test it over key>userId. Role of first found are used.
 * @param {Array::TeamUser} teamUsers 
 * @return {Array::TeamUser}
 */
const removeDublicatedTeamUsers = (teamUsers) => {
    let foundId = [];
    return teamUsers.reduce((stack, _teamUser) => {
        const id = bsonIdToString(_teamUser.userId);
        if (foundId.includes(id) === false) {
            stack.push(_teamUser);
            foundId.push(id);
        }
        return stack;
    }, []);
};


/**
 * @helper
 * @requires function::mappedInputUserIdsToTeamUsers
 * @requires function::removeNotValidUsersBySchoolIds
 * @param {Object::hook} hook 
 * @param {Array::Object::User} users 
 * @return {Array::TeamUser, default:[]} 
 */
const getTeamUsers = (hook, team, users) => {
    let teamUsers = hook.data.userIds;

    if (isObject(teamUsers) || isString(teamUsers))
        teamUsers = [teamUsers];

    if (!isArrayWithElement(teamUsers))
        return [];

    teamUsers = mappedInputUserIdsToTeamUsers(hook, teamUsers, team);
    teamUsers = teamOwnerRoleExist(hook, teamUsers, team, users);
    teamUsers = removeDublicatedTeamUsers(teamUsers);
    teamUsers = removeNotValidUsersBySchoolIds(team.schoolIds, teamUsers, users);

    return teamUsers;
};



/**
 * @helper
 * @param {Object::hook} hook
 * @method all - but return for no hook.data or !patch || !create an empty array 
 * @return {Array::Object::User default:[]}
 */
const populateUsersForEachUserIdinHookData = hook => {
    return new Promise((resolve, reject) => {
        if (['create', 'patch'].includes(hook.method) && hasKey(hook, 'data') && isArrayWithElement(hook.data.userIds)) {
            hook.app.service('users').find({
                query: {
                    $or: hook.data.userIds.reduce((arr, v) => {
                        arr.push({ _id: (typeof v === 'object' && v.userId) ? v.userId : v });
                        return arr;
                    }, [])
                }
            }).then(users => {
                resolve(users.data);
            }).catch(err => {
                logger.warn(err);
                reject(new errors.BadRequest('Can not search users.'));
            });
        } else {
            resolve([]);
        }
    });
};

module.exports = {
    populateUsersForEachUserIdinHookData,
    getTeamUsers,
    arrayRemoveAddDiffs,
    getTeam,
    updateMissingDataInHookForCreate,
    getSessionUser,
    ifSuperhero,
    isAcceptWay
};