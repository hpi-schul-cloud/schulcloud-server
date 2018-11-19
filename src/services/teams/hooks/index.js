'use strict';

const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const globalHooks = require('../../../hooks');
const logger = require('winston');
const { set, get } = require('./scope');
const {
    populateUsersForEachUserIdinHookData,
    getTeamUsers,
    arrayRemoveAddDiffs,
    getTeam,
    updateMissingDataInHookForCreate,
    getSessionUser,
    ifSuperhero,
    isAcceptWay
} = require('./helpers');
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
*   main hook for team services 
*   @beforeHook
*   @param {Object::hook} hook 
*   @method all
*   @ifNotLocal work only for extern requests
**/
const teamMainHook = globalHooks.ifNotLocal(hook => {
    return Promise.all([getSessionUser(hook), getTeam(hook), populateUsersForEachUserIdinHookData(hook)]).then(([sessionUser, team, users]) => {

        const userId = bsonIdToString(hook.params.account.userId);
        const restrictedFindMatch = { userIds: { $elemMatch: { userId } } };
        const isSuperhero = ifSuperhero(sessionUser.roles);
        const method = hook.method;

        if (isUndefined(sessionUser) || isUndefined(team) || isUndefined(sessionUser.schoolId))
            throw new errors.BadRequest('Bad intern call. (3)');

        const sessionSchoolId = bsonIdToString(sessionUser.schoolId);

        if (isSuperhero === false) {
            if (method === 'create') {
                team = updateMissingDataInHookForCreate(hook, sessionUser);
                users.push(sessionUser);
                hook.data = team;
            } else if (method === 'find') {
                hook.params.query = restrictedFindMatch;
                return hook;
            }
            // test if session user is in team 
            const userExist = team.userIds.some(_user => isSameId(_user.userId, userId)) || isAcceptWay(hook, team._id, team, users);
            const schoolExist = team.schoolIds.includes(sessionSchoolId);

            if (userExist === false || schoolExist === false)
                throw new errors.Forbidden('You do not have valid permissions to access this.(1)', { userExist, schoolExist });
        }
        let teamUsers;
        if (hasKey(hook, 'data') && isArrayWithElement(hook.data.userIds)) {
            teamUsers = getTeamUsers(hook, team, users);
            hook.data.userIds = teamUsers;
        }

        set(hook, 'sessionUser', sessionUser);
        set(hook, 'isSuperhero', isSuperhero);
        set(hook, 'newUsers', teamUsers || []);

        return hook;
    }).catch(err => {
        logger.warn(err);
        throw new errors.BadRequest('Bad response.');
    });
});

/**
 * mapped userIds from class to userIds, clear all double userId inputs
 * @beforeHook
 * @param {Object::hook} hook 
 * @return {Object::hook} 
 */
const updateUsersForEachClass = (hook) => {
    if (hasKey(hook.data) || !isArrayWithElement(hook.data.classIds)) {
        return hook;
    }

    let newUserList = [hook.params.account.userId];   // //add current userId?
    const add = (id) => {
        if (!newUserList.includes(id)) {
            throwErrorIfNotObjectId(id);
            newUserList.push(bsonIdToString(id));
        }
    };

    return hook.app.service('classes').find({
        query: {
            $or: hook.data.classIds.map(_id => {
                throwErrorIfNotObjectId(_id);
                return { _id };
            })
        }
    }).then(classes => {
        //add userIds from classes
        classes.data.forEach(classObj => {
            classObj.userIds.forEach(_id => {
                add(_id);
            });
        });

        //add userIds from userId list
        hook.data.userIds.forEach(obj_or_id => {
            add((isObject(obj_or_id) ? obj_or_id.userId : obj_or_id));
        });
        //update userId list
        hook.data.userIds = newUserList;
        return hook;
    }).catch(err => {
        logger.warn(err);
        throw new errors.BadRequest('Wrong input. (6)');
    });
};

/**
 * test if id exist and id a valid moongose object id
 * @beforeHook
 * @param {Object::hook} hook 
 * @returns {Promise::hook}
 */
const existId = (hook) => {
    if (['find', 'create'].includes(hook.method)) {
        return Promise.resolve(hook);
    } else if (!hook.id) {
        throw new errors.Forbidden('Operation on this service requires an id!');
    } else {
        throwErrorIfNotObjectId(hook.id);
        return Promise.resolve(hook);
    }
};

/**
 * @afterHook
 * @method patch,get
 * @param {Object::hook} hook - Add the current user to top level, easy access of it role and permissions.
 * @returns {Object::hook}
 */
const addCurrentUser = globalHooks.ifNotLocal((hook) => {
    if (isObject(hook.result) && hasKey(hook.result, '_id')) {
        const userId = bsonIdToString(hook.params.account.userId);
        const user = Object.assign({}, hook.result.userIds.find(user => (user.userId == userId || user.userId._id == userId)));
        if (isUndefined(user) || isUndefined(user.role)) {
            logger.warn('Can not execute addCurrentUser for unknown user. Or user execute a patch with the result that he has left the team.', { userId });
            return hook;
        }
        throwErrorIfNotObjectId(user.role);
        const role = hook.findRole('_id', user.role);
        user.permissions = role.permissions;
        user.name = role.name;
        hook.result.user = user;
    }
    return hook;

});

/**
 * @beforeHook
 * @param {Object::hook} - test and update missing data for methodes that contain hook.data
 * @method post
 * @returns {Object::hook}
 */
const testInputData = hook => {
    if (isUndefined(hook.data.userIds)) {
        hook.data.userIds = [];
    } else if (!isArray(hook.data.userIds)) {
        throw new errors.BadRequest('Wrong input. (3)');
    }

    if (isUndefined(hook.data.classIds)) {
        hook.data.classIds = [];
    } else if (!isArray(hook.data.classIds)) {
        throw new errors.BadRequest('Wrong input. (4)');
    }
    return hook;
};

/**
 * @beforeHook
 * @param {Object::hook} - block this methode for every request
 * @throws {errors} new errors.MethodNotAllowed('Method is not allowed!');
 */
const blockedMethod = (hook) => {
    logger.warn('[teams]', 'Method is not allowed!');
    throw new errors.MethodNotAllowed('Method is not allowed!');
};

/**
 * @hook
 * @ifNotLocal
 * @param {Array of strings} keys
 * @param {Array::String || StringPath} path - the object path to filtered data in hook or 
 * @param {Object} [objectToFilter] - is optional otherwise the hook is used
 * @returns {function::globalHooks.ifNotLocal(hook)}
 * @example filterToRelated(['_id','userIds'], 'result.data') - in hook.result.data all keys are removed that are not _id, or userIds
 */
const filterToRelated = (keys, path, objectToFilter) => {
    if(!Array.isArray(keys))
        throw new errors.NotAcceptable('Please use an array for keys.');

    return globalHooks.ifNotLocal(hook => {
        const filter = (data) => {
            const reducer = (old) => {
                return (newObject, key) => {
                    if (old[key] !== undefined)     //if related key exist
                        newObject[key] = old[key];
                    return newObject;
                };
            };
            if (Array.isArray(data))
                return data.map(element => {
                    return keys.reduce(reducer(element), {});
                });
            else
                return keys.reduce(reducer(data), {});
        };

        if (typeof path === 'string')
            path = path.split('.');

        const result = objectToFilter || hook;
        let link, linkKey;
        let target = path.length > 0 ? path.reduce((target, key) => {
            if (target[key] === undefined)
                throw new errors.NotImplemented('The path do not exist.');
            const newTarget = target[key];
            link = target;
            linkKey = key;
            return newTarget;
        }, result) : result;

        link[linkKey] = filter(target);
        return result;
    });
};

/**
 * @hook
 * @param {Object::hook}
 * @returns {Object::hook}
 */
const dataExist = hook => {
    if (isUndefined(hook.data) || !isObject(hook.data)) {
        throw new errors.BadRequest('Wrong input data.');
    }
    return hook;
};

/**
 * @afterHook
 * @param {Object::hook}
 * @returns {Object::hook}
 */
const pushUserChangedEvent = (hook) => {
    const team = getTeam(hook);
    const oldUsers = team.userIds;
    const newUsers = get(hook, 'newUsers'); //hook.additionalInfosTeam.newUsers;

    if (isUndefined(oldUsers) || isUndefined(newUsers)) {
        // logger.warn('No user infos.', { oldUsers, newUsers });    todo: cheak if undefined valid situation or not
        return hook;
    }

    const changes = arrayRemoveAddDiffs(oldUsers, newUsers, 'userId');

    if (isArrayWithElement(changes.remove) || isArrayWithElement(changes.add)) {
        set(hook, 'changes', changes);
        hook.app.emit('teams:after:usersChanged', hook);
    }

    return hook;
};



/**
 * Add teamroles to hook.teamroles.
 * Make avaible that you can use hook.findRole();
 * @hook
 * @param {Object::hook}
 * @returns {Object::hook}
 */
const teamRolesToHook = hook => {
    return hook.app.service('roles').find({
        query: { name: /team/i }
    }).then(roles => {
        if (roles.data.length <= 0) {
            throw new errors.NotFound('No team role found. (1)');
        }

        hook.teamroles = roles.data;        //add team roles with permissions to hook   

        /**
         * @param {String} key
         * @param {Object||String} value search value 
         * @param {String} [resultKey] if only one value of a key should return
         * @example hook.findRole('name','teamowner');
         * @example hook.findRole('name','teamleader','permissions'); 
         */
        hook.findRole = (key, value, resultKey) => {     //add a search function to hook
            const self = hook;

            if (isUndefined(self.teamroles)) {
                throw new errors.NotFound('No team role found. (2)');
            }

            if (isUndefined(key) || isUndefined(value)) {
                logger.warn('Bad input for findRole: ', { key, value });
                throw new errors.NotFound('No team role found. (3)');
            }
            if (isObject(value) && value._id) {      //is already a role ..for example if request use $populate
                value = value[key];
            }
            let role = self.teamroles.find(role => role[key].toString() === value.toString());
            if (role && resultKey) {
                return role[resultKey];
            } else if (role) {
                return role;
            } else {
                logger.warn({ role, value, resultKey });
                throw new errors.NotFound('No team role found. (4)');
            }
        };

        if (hook.method !== 'find') {
            const resolveInheritance = (role, stack = []) => {
                stack = stack.concat(role.permissions);
                if (role.roles.length <= 0) return stack;
                const searchRole = hook.findRole('_id', role.roles[0]);     //take only first target ...more not exist       
                return resolveInheritance(searchRole, stack);
            };

            hook.teamroles.forEach(role => {
                const solvedAllPermissions = resolveInheritance(role);
                role.permissions = solvedAllPermissions;
            });
        }

        return hook;
    }).catch(err => {
        throw new errors.BadRequest('Can not resolve team roles.', err);
    });
};
exports.teamRolesToHook = teamRolesToHook;

/**
 * @hook
 * @method get,patch,delete,create but do not work with find
 * @param permsissions
 * @param {String} _teamId
 * @return {function::function(hook)}
 */
const hasTeamPermission = (permsissions, _teamId) => {
    return (hook) => {

        if (get(hook, 'isSuperhero') === true)
            return hook;

        if (isString(permsissions))
            permsissions = [permsissions];

        const wait = new Promise((resolve, reject) => {
            if (isFunction(hook.findRole)) {
                resolve(hook.findRole);
            } else {
                teamRolesToHook(hook).then(_hook => {
                    resolve(_hook.findRole);
                }).catch(err => {
                    logger.warn(err);
                    reject(new errors.Conflict('Team roles can not assign to hook.'));
                });
            }
        });

        return Promise.all([getSessionUser(hook), wait, getTeam(hook)]).then(([sessionUser, findRole, team]) => {
            if (get(hook, 'isSuperhero') === true)
                return hook;

            const userId = bsonIdToString(hook.params.account.userId);
            const teamId = _teamId || hook.teamId || hook.id;
            const teamUser = team.userIds.find(_user => isSameId(_user.userId, userId));

            if (isUndefined(teamUser))
                throw new errors.NotFound('Session user is not in this team userId=' + userId + ' teamId=' + teamId);

            const teamRoleId = teamUser.role;
            const userTeamPermissions = findRole('_id', teamRoleId, 'permissions');

            permsissions.forEach(_permsission => {
                if (userTeamPermissions.includes(_permsission) === false) {
                    throw new errors.Forbidden('No permission=' + _permsission + ' found!');
                }
            });

            return hook;
        }).catch(err => {
            logger.warn(err);
            throw new errors.Forbidden('You have not the permission to access this. (2)');
        });

    };
};
exports.hasTeamPermission = hasTeamPermission;    //to use it global

/**
 * @hook
 * @requires restrictToCurrentSchoolAndUser - for faster use, otherwise 
 */
const changeTestForPermissionRouting = (hook) => {
    return hook.data ? hook : Promise.resolve(hook)
        .then(_hook => {
            return _hook;
        }).catch(err => {
            logger.warn(err);
            throw new errors.Forbidden('You have not the permission to access this. (1)');
        });

};

const keys = {
    resFind: ['_id', 'name', 'times', 'description', 'userIds', 'color'],
    resId: ['_id'],
    query: ['$populate', '$limit'],
    data: ['filePermission', 'name', 'times', 'description', 'userIds', 'color', 'features', 'ltiToolIds', 'classIds', 'startDate', 'untilDate', 'schoolId']
};



//todo: TeamPermissions
exports.before = {
    all: [
        auth.hooks.authenticate('jwt'),
        existId,
        filterToRelated(keys.query, 'params.query'),
        globalHooks.ifNotLocal(teamRolesToHook)
    ],
    find: [
        teamMainHook,
        changeTestForPermissionRouting
    ],
    get: [teamMainHook],              //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [
        filterToRelated(keys.data, 'data'),
        globalHooks.injectUserId,
        testInputData,
        updateUsersForEachClass,
        teamMainHook
    ], //inject is needing?
    update: [blockedMethod],
    patch: [
        updateUsersForEachClass,
        teamMainHook
    ], //todo: filterToRelated(keys.data,'data') 
    remove: [
        teamMainHook,
        hasTeamPermission('DELETE_TEAM')
    ]
};

//todo:clear unused values
//todo: update moongose
exports.after = {
    all: [],
    find: [filterToRelated(keys.resFind, 'result.data')], // filterFindResult
    get: [addCurrentUser],                                 //see before (?)
    create: [filterToRelated(keys.resId, 'result')],
    update: [],                             //test schoolId remove
    patch: [
        addCurrentUser,
        pushUserChangedEvent
    ],          //test schoolId remove
    remove: [filterToRelated(keys.resId, 'result')]
};

function createinfoText(hook) {
    let text;
    const newRegistration = ((hook.result.linkData || {}).link || "").includes("/registration/");
    if (newRegistration) {
        text = `Hallo ${hook.data.email}!
\nDu wurdest von ${hook.params.account.username} eingeladen, dem Team '${hook.additionalInfosTeam.team.name}' der ${process.env.SC_SHORT_TITLE} beizutreten.
Da du noch keinen ${process.env.SC_SHORT_TITLE} Account besitzt, folge bitte diesem Link, um die Registrierung abzuschließen und dem Team beizutreten: ${hook.result.linkData.shortLink}
\nViel Spaß und einen guten Start wünscht dir dein
${process.env.SC_SHORT_TITLE}-Team`;
    } else {
        text = `Hallo ${hook.data.email}!
\nDu wurdest von ${hook.params.account.username} eingeladen, dem Team '${hook.additionalInfosTeam.team.name}' der ${process.env.SC_SHORT_TITLE} beizutreten.
Klicke auf diesen Link, um die Einladung anzunehmen: ${hook.result.linkData.shortLink}
\nViel Spaß und gutes Gelingen wünscht dir dein
${process.env.SC_SHORT_TITLE}-Team`;
    }
    return text;
}

const sendInfo = hook => {

    if (isUndefined(hook.data.email) || isUndefined((hook.result || {}).linkData)) {
        return hook;
    }

    const email = hook.data.email;
    if (isDefined(email)) {
        globalHooks.sendEmail(hook, {
            "subject": `${process.env.SC_SHORT_TITLE}: Team-Einladung`,
            "emails": [email],
            "content": {
                "text": createinfoText(hook)
            }
        });
    }

    return hook;
};

exports.beforeExtern = {
    all: [
        auth.hooks.authenticate('jwt'),
        existId,
        teamRolesToHook,
        filterToRelated([], 'params.query')
    ],
    find: [],
    get: [],
    create: [blockedMethod],
    update: [blockedMethod],
    patch: [
        dataExist,
        hasTeamPermission(['INVITE_EXPERTS', 'INVITE_ADMINISTRATORS']),
        filterToRelated(['userId', 'email', 'role'], 'data')
    ],   //later with switch ..see role names
    remove: [blockedMethod]
};

exports.afterExtern = {
    all: [],
    find: [filterToRelated(keys.resFind, 'result.data')],
    get: [],
    create: [],
    update: [],
    patch: [sendInfo, filterToRelated(['message', '_id'], 'result')],
    remove: []
};
