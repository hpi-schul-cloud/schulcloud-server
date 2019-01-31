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
        if (isString(roles[0])) {
            isSuperhero = roles.includes('superhero');      //todo: make no sense at the moment roles includes only the ids of the roles
        } else if (isObject(roles[0])) {
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
* @return {Object::User}
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
                reject(new errors.NotFound('Can not find user with userId=' + sessionUserId, err));
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
* @return {Object::hook}
*/
const addDefaultFilePermissions = (hook) => {
    if (isUndefined([hook.data, hook.teamroles], 'OR'))
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
    const selectedRole = 'teamowner';
    const newUser = createUserWithRole(hook, { userId, selectedRole, schoolId });
    if (index === -1)
        hook.data.userIds.push(newUser);
    else
        hook.data.userIds[index] = newUser;

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
* @return {Promise::res.data[0]}
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
        if (isDefined([oldTeam, users, acceptUserId], 'AND')) {
            //try the second test that user must be in invite
            const addingUser = users.find(_user => isSameId(_user._id, acceptUserId));
            const addingTeamUser = hook.data.userIds.find(_user => isSameId(_user.userId, acceptUserId));
            //todo add addingUser role ==== 'expert' test
            if (isUndefined([addingUser, addingTeamUser], 'OR'))
                return false;
            /*
                        let bool = false;
                        oldTeam.invitedUserIds.map(inv => {
                            if (['teamexpert', 'teamadministrator'].includes(inv.role) &&
                                addingUser.email === inv.email &&
                                inv.role === hook.findRole('_id', addingTeamUser.role, 'name')) {
                                bool = true;
                            }
                        });
                        return bool; */
            return oldTeam.invitedUserIds.some(invited => {
                const emailIsSame = addingUser.email === invited.email;
                const validRole = ['teamexpert', 'teamadministrator'].includes(invited.role);
                const roleOfInvited = invited.role === hook.findRole('_id', addingTeamUser.role, 'name');
                return emailIsSame && validRole && roleOfInvited;
            });
        } else {
            return true;
        }
    }
    return false;
};

/**
* @helper
* @requires function::extractOne
* @param {Object::hook} hook
* @return {Promise::Object::team}
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
*   @requires function::hook.findRole Can added over hook function
*   @param {Object::hook} hook
*   @param {Object::{userId,schoolId, [selectedRole]}}
*/
const createUserWithRole = (hook, { userId, schoolId, selectedRole, roleIsId }) => {
    if (isUndefined(hook.findRole))
        throw new errors.NotAcceptable('Please execute teamRolesToHook before.');

    let role;
    if (roleIsId === true) {
        role = selectedRole;
    } else {
        if (isUndefined(selectedRole))
            role = hook.findRole('name', 'teammember', '_id'); //roles.teammember;
        else
            role = hook.findRole('name', selectedRole, '_id');
    }

    if (isUndefined([role, userId, schoolId], 'OR'))
        throw new errors.BadRequest('Wrong input. (2)');

    return {
        userId: bsonIdToString(userId),
        role: bsonIdToString(role),
        schoolId: bsonIdToString(schoolId)
    }; //convert bson to string is only for faster debug
};

/**
 * return the different between arr1 in relation to arr2 
 * @helper 
 * @private
 * _old_ = [1,2,3] 
 * _new_ = [2,3,4] 
 * @example - _old_ ~ _new_ = [1] => remove item
 * @example - _new_ ~ _old_ = [4] => add item
 * @param {Array::*} oldArray
 * @param {Array::*} newArray
 * @param {String} key
 * @return {Array::*} 
 */
const arrayDiff = (oldArray, newArray, key) => {
    if (!isArrayWithElement(oldArray) || !isArrayWithElement(newArray))
        throw new errors.NotAcceptable('Wrong input expect arrays.', { oldArray, newArray });

    let a1BsonId = false;
    if (isDefined(key) && isObjectIdWithTryToCast(oldArray[0][key]))
        a1BsonId = true;

    let a2BsonId = false;
    if (isDefined(key) && isObjectIdWithTryToCast(newArray[0][key]))
        a2BsonId = true;

    const diff = (a1, a2) => {
        if (isDefined(key))
            a2 = a2.map(e => a2BsonId ? bsonIdToString(e[key]) : e[key]);
        return a1.filter(x => !a2.includes(a1BsonId ? bsonIdToString(x[key]) : x[key] || x));
    };

    return diff(oldArray, newArray);
};

/**
 * @helper
 * @requires function:arrayDiff
 * @param {Array::*} baseArray 
 * @param {Array::*} changedArray 
 * @param {String} [key] - optional for objects in arrays
 * @return {Object::{remove:[],add:[]} }
 */
const arrayRemoveAddDiffs = (baseArray, changedArray, key) => {
    return { remove: arrayDiff(baseArray, changedArray, key), add: arrayDiff(changedArray, baseArray, key) };
};

// todo: use createUserWithRole to set new users
/**
 * @helper 
 * @private
 * @requires function::createUserWithRole
 * @param {Object::hook} hook
 * @param {Array::(stringId||Object::TeamUser||Object::String)} teamUsers 
 * @param {Object::Team}
 * @param {String||BsonId} schoolId use sessionSchoolId
 */
const mappedInputUserIdsToTeamUsers = (hook, teamUsers, oldTeam, sessionSchoolId) => {
    if (!isArray(teamUsers))
        throw new errors.BadRequest('param teamUsers must be an array', teamUsers);

    const getFirstUserByRoleId = (teamUserArray, roleId) => {
        return teamUserArray.find(_user => isSameId(_user.role, roleId));
    };
    const teamownerRoleId = hook.findRole('name', 'teamowner', '_id');
    const teamowner = hook.method === 'create' ? getFirstUserByRoleId(teamUsers, teamownerRoleId) : getFirstUserByRoleId(oldTeam.userIds, teamownerRoleId);

    if (isUndefined(teamowner))       //by create no old team exist
        throw new errors.NotAcceptable('No teamowner found for this team.');

    return teamUsers.map((e) => {
        let selectedRole;
        const userId = hasKey(e, 'userId') ? e.userId : e;
        const schoolId = hasKey(e, 'schoolId') ? e.schoolId : sessionSchoolId;

        if (hasKey(e, 'role')) {
            if (isObjectIdWithTryToCast(e.role))
                selectedRole = e.role;                                      //if bsonId, or stringId
            else
                selectedRole = hook.findRole('name', e.role, '_id');        //if it is role string
        } else {
            selectedRole = hook.findRole('name', 'teammember', '_id');
        }

        //teamowner role can not repatched at the moment todo: later test if any other has this role, after map 
        if (isSameId(teamowner.userId, userId)) {
            return createUserWithRole(hook, {
                userId,
                selectedRole: teamownerRoleId,
                schoolId: teamowner.schoolId,
                roleIsId: true
            });
        } else {
            return createUserWithRole(hook, {
                userId,
                selectedRole,
                schoolId,
                roleIsId: true
            });
        }
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
    /*
    return teamUsers.reduce((list, teamUser) => {
        if (!userIds.includes(teamUser.userId))
            list.push(teamUser);
        return list;
    }, []);
    */
    return teamUsers.filter(user => !userIds.includes(user.userId));
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
const removeDuplicatedTeamUsers = (teamUsers) => {
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
 * @param {String||BsonId} sessionSchoolId
 * @return {Array::TeamUser, default:[]} 
 */
const getTeamUsers = (hook, team, users, sessionSchoolId) => {
    let teamUsers = hook.data.userIds;

    if (isObject(teamUsers) || isString(teamUsers))
        teamUsers = [teamUsers];

    if (!isArrayWithElement(teamUsers))
        return [];

    teamUsers = mappedInputUserIdsToTeamUsers(hook, teamUsers, team, sessionSchoolId),
        teamUsers = teamOwnerRoleExist(hook, teamUsers, team, users);
    teamUsers = removeDuplicatedTeamUsers(teamUsers);
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
    isAcceptWay,
    createUserWithRole
};