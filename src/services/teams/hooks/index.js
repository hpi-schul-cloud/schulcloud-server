'use strict';

const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const globalHooks = require('../../../hooks');
const Schema = require('mongoose').Schema;
const logger = require('winston');
const { set, get } = require('./scope');


/**
 * Test if roles stack is superhero. 
 * @helper 
 * @requires {$populated roles}
 */
const ifSuperhero = (roles) => {
    let isSuperhero = false;
    if (Array.isArray(roles) && roles.length > 0) {
        const type = typeof roles[0];
        if (type === 'string') {
            isSuperhero = roles.includes('superhero');      //todo: make no sense at the moment roles includes only the ids of the roles
        } else if (type === 'object') {
            if (roles.find(_role => _role.name === 'superhero') !== undefined) {
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
        /*   if (hook.additionalInfosTeam === undefined) {
              hook.additionalInfosTeam = {};
          } */
        const sessionUserId = hook.params.account.userId.toString();
        const sessionUser = get(hook, 'sessionUser');
        if (sessionUser !== undefined) {
            if (get(hook, 'isSuperhero') === undefined)
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
* @param {hook} hook 
* @returns {Object::hook}
*/
const addDefaultFilePermissions = (hook) => {
    if (hook.data === undefined || hook.teamroles === undefined)
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
 * 
 * @param {hook} hook 
 * @param {Object::User} sessionUser 
 * @return {Object::hook.data} 
 */
const updateMissingDataInHookForCreate = (hook, sessionUser) => {
    const userId = sessionUser._id.toString();
    const schoolId = sessionUser.schoolId.toString();

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
* @param {Object::Valid Moongose Response from find} mongooseResponse 
* @returns {Promise::res.data[0]} 
*/
const extractOne = (mongooseResponse) => {
    if ((mongooseResponse.data || []).length == 1)
        return Promise.resolve(mongooseResponse.data[0]);
    else
        return Promise.reject(new errors.NotAcceptable('extractOne() length is !== 1', { expectedArrayWithData: mongooseResponse.data }));
};

/**
* @helper
* @param {*} hook
* @returns {Promise::Object::team} 
*/
const getTeam = (hook) => {
    return new Promise((resolve, reject) => {
        const method = hook.method;
        const teamId = hook.id || (hook.result || {})._id || hook.teamId || get(hook, 'teamId');
        const sessionUserId = hook.params.account.userId.toString();
        const restrictedFindMatch = { $elemMatch: { userId: sessionUserId } };
        const teamsService = hook.app.service('teams');

        const resolveIt = data => {
            set(hook, 'team', data);    //set it for later use 
            resolve(data);
        };

        if (get(hook, 'team') !== undefined) {
            resolveIt(get(hook, 'team'));
        } else if (method === 'create') {
            resolveIt(hook.data);
        } else if (teamId) {
            teamsService.find({
                query: { _id: teamId, userIds: restrictedFindMatch }
            }).then(_teams => {
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
                query: { userIds: restrictedFindMatch }
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
*   @param {hook} hook
*   @param {String} userId
*   @param {String} selectedRole
*/
const createUserWithRole = (hook, userId, selectedRole) => {
    let role;
    if (selectedRole === undefined) {
        role = hook.findRole('name', 'teammember', '_id'); //roles.teammember;
    } else {
        role = hook.findRole('name', selectedRole, '_id');
    }
    if (role === undefined || userId === undefined) {
        throw new errors.BadRequest('Wrong input. (2)');
    }

    return { userId, role };
};

/**
 * helper - return the different between arr1 in relation to arr2 
 * _old_ = [1,2,3] 
 * _new_ = [2,3,4] 
 * @example - _old_ ~ _new_ = [1] => remove item
 * @example - _new_ ~ _old_ = [4] => add item
 * @param {Array} oldArray
 * @param {Array} newArray
 * @param {String} key
 * @returns {Array} 
 */
const arrayDiff = (oldArray, newArray, key) => {
    // try {
    if (Array.isArray(oldArray) === false || Array.isArray(newArray) === false) {
        throw new errors.NotAcceptable('Wrong input expect arrays, get oldArray=' + Array.isArray(oldArray) + ' and newArray=' + Array.isArray(newArray));
    }
    if (oldArray.length <= 0 || newArray.length <= 0) {
        throw new errors.LengthRequired('Wrong input expect arrays.length>0, get oldArray=' + oldArray.length + ' and newArray=' + newArray.length);
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
*   @helper
*   @requires const Schema = require('mongoose').Schema;
*   @return {boolean default=true} - otherwise see @throws
*   @throws {BadRequest} - If input is no typeof moongose Schema.Types.ObjectId it is throw an error
*/
const testIfObjectId = (id) => {
    if (id instanceof Schema.Types.ObjectId || id === undefined) {
        throw new errors.BadRequest('Wrong input. (5)');
    }
    return true;
};


/**
 * mapped userIds from class to userIds, clear all double userId inputs
 * @param {Object::hook} hook 
 * @return {Object::hook} 
 */
const updateUsersForEachClass = (hook) => {
    if ((hook.data.classIds || {}).length === undefined || hook.data.classIds.length <= 0) {
        return hook;
    }

    let newUserList = [hook.params.account.userId];   // //add current userId?
    const add = (id) => {
        if (newUserList.includes(id) === false) {
            testIfObjectId(id);
            newUserList.push(id);
        }
    };

    return hook.app.service('classes').find({
        query: {
            $or: hook.data.classIds.map(_id => {
                testIfObjectId(_id);
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
            add((typeof obj_or_id === 'object' ? obj_or_id.userId : obj_or_id));
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
 * @helper
 * @param {Object::hook} hook 
 * @param {Object::team} team 
 * @param {Array::Object::User} users 
 * @return {Array::TeamUser} 
 */
const mappedUsersToRoleSchemaUsersIds = (hook, team, users) => {
    const userIds = hook.data.userIds;
    if (Array.isArray(userIds) && userIds.length > 0) {     //hook.data.schoolIds can only inject by links or create, patch should not pass it 
        const schools = team.schoolIds.map(_id => {
            return _id.toString();
        });
        //Only users from schools that are related to this team can be passed
        const newUsersIds = users.reduce((arr, user) => {
            const schoolId = user.schoolId.toString();
            if (schools.includes(schoolId)) {
                const _id = user.userId || user._id.toString();
                let teamUser = team.userIds.find(teamUser => (teamUser.userId || {}).toString() === _id); //already inside the team

                if (teamUser === undefined) {
                    teamUser = hook.data.userIds.find(teamUser => (teamUser.userId || {}).toString() === _id && teamUser.role); // new with role  todo: if role is string and not objectId then match to role with hook.findRole
                }

                if (teamUser === undefined) {
                    teamUser = createUserWithRole(hook, _id);                                           // new with id
                }
                arr.push(teamUser);
            }
            return arr;
        }, []);

        if (newUsersIds.length <= 0) {
            throw new errors.BadRequest('This request will removed all users for schools in this team. It is blocked. Please use remove to delete this team.');
        }

        hook.data.userIds = newUsersIds;
        return newUsersIds;
    }
};

/**
 * 
 * @param {Object::hook} hook
 * @method all - but return for no hook.data or !patch || !create an empty array 
 * @return {Array::Object::User default:[]}
 */
const populateUsersForEachUserIdinHookData = hook => {
    return new Promise((resolve, reject) => {
        if (['create', 'patch'].includes(hook.method) === false ||
            Array.isArray(hook.data.userIds) === false ||
            hook.data.userIds.length <= 0) {
            resolve([]);
        }

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
    });
};


/**
*   main hook for team services 
*   @param {Object::hook} hook 
*   @method all
*   @ifNotLocal work only for extern requests
**/
const teamMainHook = globalHooks.ifNotLocal(hook => {
    return Promise.all([getSessionUser(hook), getTeam(hook), populateUsersForEachUserIdinHookData(hook)]).then(([sessionUser, team, users]) => {

        const userId = hook.params.account.userId.toString();
        const restrictedFindMatch = { userIds: { $elemMatch: { userId } } };
        const isSuperhero = ifSuperhero(sessionUser.roles);

        if (sessionUser === undefined || team === undefined || sessionUser.schoolId === undefined) 
            throw new errors.BadRequest('Bad intern call. (3)');

        const sessionSchoolId = sessionUser.schoolId.toString();

        if (isSuperhero === false) {
            if (hook.method === 'create') {
                team = updateMissingDataInHookForCreate(hook, sessionUser);
                users.push(sessionUser);
            }

            if (hook.method === 'find') {
                hook.params.query = restrictedFindMatch;
                return hook;
            }
            // test if session user is in team 
            const userExist = team.userIds.some(_user => _user.userId.toString() === userId);
            const schoolExist = team.schoolIds.includes(sessionSchoolId);

            if (userExist === false || schoolExist === false) 
                throw new errors.Forbidden('You do not have valid permissions to access this.(1)', { userExist, schoolExist });
        }

        const updatedUserIds = mappedUsersToRoleSchemaUsersIds(hook, team, users);
        //pass it to hook for later use...
        set(hook, 'newUsers', updatedUserIds);
        set(hook, 'sessionUser', sessionUser);
        set(hook, 'isSuperhero', isSuperhero);

        //todo: create test if teamname in schoolId/s unique

        return hook;
    });
});

/**
 * test if id exist and id a valid moongose object id
 * @param {Object::hook} hook 
 * @returns {Promise::hook}
 */
const existId = (hook) => {
    if (['find', 'create'].includes(hook.method)) {
        return Promise.resolve(hook);
    } else if (!hook.id) {
        throw new errors.Forbidden('Operation on this service requires an id!');
    } else {
        testIfObjectId(hook.id);
        return Promise.resolve(hook);
    }
};

/**
 * @param hook - Add the current user to top level, easy access of it role and permissions.
 * @after hook
 * @method patch,get
 */
const addCurrentUser = globalHooks.ifNotLocal((hook) => {
    if (hook.injectLink) {
        return hook;
    }
    if (typeof hook.result === 'object' && hook.result._id !== undefined) {
        const userId = hook.params.account.userId.toString();
        const user = Object.assign({}, hook.result.userIds.find(user => (user.userId == userId || user.userId._id == userId)));
        if (user === undefined || user.role === undefined) {
            logger.warn('Can not execute addCurrentUser for unknown user. Or user execute a patch with the result that he has left the team.', { userId });
            return hook;
        }
        testIfObjectId(user.role);
        const role = hook.findRole('_id', user.role);
        user.permissions = role.permissions;
        user.name = role.name;
        hook.result.user = user;
    }
    return hook;

});

/**
 * @param hook - test and update missing data for methodes that contain hook.data
 * @method post
 */
const testInputData = hook => {
    if (hook.data.userIds === undefined) {
        hook.data.userIds = [];
    } else if (!(Array.isArray(hook.data.userIds))) {
        throw new errors.BadRequest('Wrong input. (3)');
    }

    if (hook.data.classIds === undefined) {
        hook.data.classIds = [];
    } else if (!(Array.isArray(hook.data.classIds))) {
        throw new errors.BadRequest('Wrong input. (4)');
    }
    return hook;
};

/**
 * @param hook - block this methode for every request
 */
const blockedMethod = (hook) => {
    logger.warn('[teams]', 'Method is not allowed!');
    throw new errors.MethodNotAllowed('Method is not allowed!');
};

/**
 * @param {Array of strings} keys
 * @param {Array of strings} path - the object path to filtered data in hook or 
 * @param [{Object}] objectToFilter - is optional otherwise the hook is used
 */
const filterToRelated = (keys, path, objectToFilter) => {
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
 * @param hook
 */
const dataExist = hook => {
    if (hook.data === undefined || typeof hook.data !== 'object') {
        throw new errors.BadRequest('Wrong input data.');
    }
    return hook;
};

/**
 * @param hook
 * @after
 */
const pushUserChangedEvent = (hook) => {
    /*  if (hook.additionalInfosTeam === undefined) {
          logger.warn('This hook need additionalInfosTeam.');
          return hook
      } */
    const team = getTeam(hook);
    const oldUsers = team.userIds;
    const newUsers = get(hook, 'newUsers'); //hook.additionalInfosTeam.newUsers;

    if (oldUsers === undefined || newUsers === undefined) {
        // logger.warn('No user infos.', { oldUsers, newUsers });    todo: cheak if undefined valid situation or not
        return hook;
    }

    const changes = arrayRemoveAddDiffs(oldUsers, newUsers, 'userId');

    if (changes.remove.length > 0 || changes.add.length > 0) {
        hook.additionalInfosTeam.changes = changes;
        hook.app.emit('teams:after:usersChanged', hook);
    }

    return hook;
};



/**
 * @param hook - Add teamroles to hook.teamroles
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
         * @param {key as string} - search key
         * @param {value as object} - search value 
         * @param {[resultKey as string]} - if only one value of a key should return
         * @example hook.findRole('name','teamowner');
         * @example hook.findRole('name','teamleader','permissions'); 
         */
        hook.findRole = (key, value, resultKey) => {     //add a search function to hook
            const self = hook;

            if (self.teamroles === undefined) {
                throw new errors.NotFound('No team role found. (2)');
            }

            if (key === undefined || value === undefined) {
                logger.warn('Bad input for findRole: ', { key, value });
                throw new errors.NotFound('No team role found. (3)');
            }
            if (typeof value === 'object' && value._id) {      //is already a role ..for example if request use $populate
                value = value[key];
            }
            let role = self.teamroles.find(role => role[key].toString() === value.toString());
            if (resultKey) {
                return role[resultKey];
            } else if (role) {
                return role;
            } else {
                logger.warn({ role, value, resultKey });
                throw new errors.NotFound('No team role found. (4)');
            }
        };

        const method = hook.method;

        if (method !== 'find') {
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
 *  @global
 *  @method get,patch,delete,create but do not work with find
 */
const hasTeamPermission = (permsissions, _teamId) => {
    return (hook) => {

        if (get(hook, 'isSuperhero') === true)
            return hook;

        if (typeof permsissions === 'string')
            permsissions = [permsissions];

        const wait = new Promise((resolve, reject) => {
            if (typeof hook.findRole === 'function') {
                resolve(hook.findRole);
            } else {
                teamRolesToHook(hook).then(_hook => {
                    resolve(_hook.findRole);
                });
            }
        });

        return Promise.all([getSessionUser(hook), wait, getTeam(hook)]).then(([sessionUser, findRole, team]) => {
            if (get(hook, 'isSuperhero') === true)
                return hook;

            const userId = hook.params.account.userId.toString();
            const teamId = _teamId || hook.teamId || hook.id;
            const teamUser = team.userIds.find(_user => _user.userId.toString() === userId);

            if (teamUser === undefined)
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
	const newRegistration = ((hook.result.linkData||{}).link||"").includes("/registration/");
	if(newRegistration) {
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

    if (hook.data.email === undefined)
        return hook;
    

    const teamName = (hook.result || {}).name;
    const email = hook.data.email;
    
    if(email) {
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
        teamRolesToHook
    ],
    find: [],
    get: [],
    create: [blockedMethod],
    update: [blockedMethod],
    patch: [
        dataExist,
        hasTeamPermission(['INVITE_EXPERTS', 'INVITE_ADMINISTRATORS'])
    ],   //later with switch ..see role names
    remove: [blockedMethod]
};

exports.afterExtern = {
    all: [],
    find: [filterToRelated(keys.resFind, 'result.data')],
    get: [],
    create: [],
    update: [],
    patch: [sendInfo, filterToRelated(['message'], 'result')],
    remove: []
};
