'use strict';

const auth        = require('feathers-authentication');
const errors      = require('feathers-errors');
const globalHooks = require('../../../hooks');
const Schema      = require('mongoose').Schema;


/**
 *  @gloabal
 *  @method get,patch,delete,create but do not work with find
 */
const hasTeamPermission=(permsissions,teamId)=>{
    return (hook)=>{
        const userId = hook.params.account.userId;
        const teamId = hook.id||teamId;
       // const role   = hook.findRole()
        if(typeof permsissions==='string'){
            permsissions=[permsissions];
        }

    };
};
exports.hasTeamPermission=hasTeamPermission;    //to use it global

/**
*   helper
*/
const createUserWithRole=(hook,userId,selectedRole)=>{
    let role;
    if(selectedRole===undefined){
        role = hook.findRole('name','teammember','_id'); //roles.teammember;
    }else{
        role = hook.findRole('name',selectedRole,'_id');;
    }
    if(role===undefined || userId===undefined){
        throw new errors.BadRequest('Wrong input. (2)');
    }

    return {userId,role}
}

/**
*   helper
*/
const extractOne = (res,errorMessage) => {
    if ( (res.data||{}).length == 1) {
        return res.data[0]
    } else {
        if(res.data.length===0){
            throw new errors.NotFound('The user is not in this team, or no team is avaible.',{errorMessage:errorMessage||''});
        }else{
            throw new errors.BadRequest('Bad intern call. (1)',{errorMessage:errorMessage||''});
        }
    }
}

/**
*   helper
*   @requires const Schema = require('mongoose').Schema;
*/
const testIfObjectId = (id)=>{
    if(id instanceof Schema.Types.ObjectId){
        throw new errors.BadRequest('Wrong input. (5)');
    }
}

/**
 * @param hook - mapped userIds from class to userIds, clear all double userId inputs
 */
const updateUsersForEachClass = (hook) => {
    if( (hook.data.classIds||{}).length<=0 ){
        return hook
    }

    let newUserList = [hook.params.account.userId];   // //add current userId?
    const add=(id)=>{
        if( newUserList.includes(id)===false){
            testIfObjectId(id);
            newUserList.push(id);
        }
    }

    return hook.app.service('classes').find({
        query:{$or:hook.data.classIds.map( _id=>{
                testIfObjectId(_id);
                return {_id}
            })
        }
    }).then(classes=>{
        //add userIds from classes
        classes.data.forEach( classObj=>{
            classObj.userIds.forEach(_id=>{
                add(_id)
            });
        });

        //add userIds from userId list
        hook.data.userIds.forEach(obj_or_id=>{
            add( (typeof obj_or_id==='object' ? obj_or_id.userId : obj_or_id) );
        });
        //update userId list
        hook.data.userIds=newUserList;
        return hook
    }).catch(err=>{
        throw new errors.BadRequest('Wrong input. (6)');
    })
};


/**
*   @param hook - main hook for team services
*   @method all
*   @ifNotLocal - work only for extern requests
**/
const restrictToCurrentSchoolAndUser = globalHooks.ifNotLocal(hook => {
    const teamId = hook.id;
    const method = hook.method;
    const sessionUserId = hook.params.account.userId;

    if(teamId!==undefined){
        testIfObjectId(teamId);
    }

    /********************
     *  get user data   *
     * ******************/
    const usersService = hook.app.service('users');
    const waitUser     = usersService.find({
        query: {
            _id: sessionUserId,
            $populate: 'roles'
        }
    }).then(users => {
        return extractOne(users,'Find current user.');
    }).catch(err => {
        throw new errors.BadRequest('User can not found.',err);
    })

    /********************
     *  get team data   *
     * ******************/
    const teamsService = hook.app.service('teams');
    const waitTeams    = new Promise((resolve, reject) => {
        if (method === 'create' && teamId === undefined) {

            //set owner
            if(hook.data.userIds===undefined){
                hook.data.userIds=[];
            }

            const index = hook.data.userIds.indexOf(sessionUserId);
            const value = createUserWithRole(hook,sessionUserId,'teamowner');
            if(index==-1){
                hook.data.userIds.push(value);      //add owner
            }else{
                hook.data.userIds[index]=value;     //replace with obj
            }

            //add team flag
            hook.data.features=['isTeam'];

            resolve(hook.data);       //team do not exist        //todo: Add hook.data as team information and let go to complet execut with any test
        } else if (method === 'find' && teamId === undefined) {     //!!Abhängigkeit von token und query sessionUserId wird nicht geprüft -> to be discuss!
            //return teams
            teamsService.find({
                query:{
                    userIds: {$elemMatch:{sessionUserId}}
                }
            }).then(teams=>{
                resolve( teams.data );
            }).catch(err=>{
               reject( new errors.BadRequest('Bad intern call. (2)',err) );
            });
        } else if (teamId) {    //patch, delete, get
            const query = (method==='patch' ? {_id:teamId} : {_id:teamId, userIds : {$elemMatch:{userId:sessionUserId}}});

            teamsService.find({                     //match test by teamId and sessionUserId
                query: query                        //if patch sessionUser is not in team, if delete and get sessionUser is in. 
            }).then(teams => {
                resolve(extractOne(teams,'Find current team.'));
            }).catch(err => {
                err.code===404 ? reject(err) : reject( new errors.BadRequest('Wrong input. (1)',err) );
            });
        }
    });

    /***************
     *   execute    *
     * **************/
    return Promise.all([waitUser, waitTeams]).then( data => {
        //const inputSchoolId = (hook.data||{}).schoolId || (hook.params.query||{}).schoolId;
        const sessionUser = data[0];
        let   team        = data[1];
        const isSuperhero = sessionUser.roles.includes('superhero');
        if (data.length!=2 || sessionUser === undefined || team===undefined || sessionUser.schoolId===undefined) {
            throw new errors.BadRequest('Bad intern call. (3)');
        }
        const sessionSchoolId = sessionUser.schoolId.toString();  //take from user db

        if (method !== 'create' && method !== 'patch' && isSuperhero===false ) {
            //test if asked school in team
            if (!Array.isArray(team)) {
                team=[team];
            }
            team.forEach(_team=>{
                if (_team.schoolIds.includes(sessionSchoolId) === false) {
                    throw new errors.Forbidden('You do not have valid permissions to access this.(1)');
                }
            });
        }

        if(method === 'create' && isSuperhero===false){    //superheros schoolId do not added
            hook.data.schoolIds = [sessionSchoolId];       //add user to session    
        }


        /*
        //add current schoolId to hook
        //todo: maybe schoolId can pass in every case to hook.data.schoolId
        //todo: maybe it work better to create test if is already set and rejected, after it set one time
        if (method == "get" || method == "find") {                  //by find and get use query to pass additional data
            if (hook.params.query.schoolId == undefined) {          //should undefined
                hook.params.query.schoolId = schoolId;
            } else if (hook.params.query.schoolId != schoolId) {
                throw new errors.Forbidden('You do not have valid permissions to access this.(2)');
            }
        } else {                                                     //for any other methode add it do data
            if (hook.data.schoolIds == undefined) {                   //should undefined
                hook.data.schoolIds = [schoolId];                     //need array
            } else if (hook.data.schoolId != schoolId) {              //account schoolId === send schoolId
                throw new errors.Forbidden('You do not have valid permissions to access this.(3)');
            }
        }
        */
        //move to additonal hook?
        //map userIds to {userId:teamRoleId} tupel
        if( (hook.data.userIds||{}).length>0 ){
             hook.data.userIds=hook.data.userIds.map(e=>{
                 //map object ids to strings
                if(e._bsontype==='ObjectID' || typeof e === 'string' ){
                    return createUserWithRole(hook,e.toString());
                }else if(typeof e === 'object'){
                    e.userId = e.userId.toString();
                    if(e.role===undefined){   
                        e=createUserWithRole(hook,e.userId);
                    }
                    testIfObjectId(e.role);
                    return e
                }
            });
        }
        //todo: create test if teamname in schoolId/s unique

        return hook;
    })
});

/**
 * @param hook - test if id exist and id a valid moongose object id
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
const addCurrentUserWithPermissionsToTopLevel=globalHooks.ifNotLocal( (hook)=>{
    if(hook.injectLink){
        return hook
    }
    if(typeof hook.result==='object' && hook.result._id !== undefined){
        const userId    = hook.params.account.userId.toString();
        const user      = Object.assign({},hook.result.userIds.find( user => (user.userId == userId || user.userId._id == userId) )); 
        
        testIfObjectId((user||{}).role);
        const role       = hook.findRole('_id',user.role);
        user.permissions = role.permissions;
        user.name        = role.name;
        hook.result.user = user;     
    }
    return hook
    
});

/**
 * @param hook - test and update missing data for methodes that contain hook.data
 * @method post
 */
const testInputData=hook=>{
    if(hook.data.userIds===undefined){
        hook.data.userIds=[];
    }else if( !(Array.isArray(hook.data.userIds)) ){
        throw new errors.BadRequest('Wrong input. (3)')
    }

    if(hook.data.classIds===undefined){
        hook.data.classIds=[];
    }else if( !(Array.isArray(hook.data.classIds)) ){
        throw new errors.BadRequest('Wrong input. (4)')
    }
    return hook
}

/**
 * @param hook - block this methode for every request
 */
const blockedMethode=(hook)=>{
    throw new errors.MethodNotAllowed('Method is not allowed!');
}

/**
 * @param hook - clear and map return ressources to related
 * @method remove,create,patchOverLink
 * @after hook
 */ 
/*
const filterRemoveCreateLinkResult=(hook)=>{
    if(typeof hook.result==='object' && hook.result._id !== undefined){
        hook.result={_id:hook.result._id};
    }
    return hook
}
 */

/**
 * @param {Array of strings} keys
 * @param {Array of strings} path - the object path to filtered data in hook or 
 * @param [{Object}] objectToFilter - is optional otherwise the hook is used
 */
const filterToRelated=(keys,path,objectToFilter)=>{
	return globalHooks.ifNotLocal(hook=>{
        const filter = (data)=>{
            const reducer =(old)=>{
                return (newObject,key)=>{
                    if(old[key]!==undefined)     //if related key exist
                        newObject[key]=old[key];
                    return newObject
            }}
            if(Array.isArray(data))
                return data.map(element=>{
                    return keys.reduce(reducer(element),{}); 
                })
            else
                return keys.reduce(reducer(data),{}); 
        }
        const result = objectToFilter||hook;
        let link, linkKey;
        let target = path.length>0 ? path.reduce( (target,key)=>{
            if(target[key]===undefined)
                throw new errors.NotImplemented('The path do not exist.');
            const newTarget = target[key];
            link = target;
            linkKey = key;
            return newTarget
        },result) : result;

        link[linkKey] = filter(target);
 
		return result
	});
}

/**
 * @param hook - clear and map return ressources to related
 * @method find
 * @after hook
 * @requires hook.filterMoongoseResult
 *//*
const filterFindResult=globalHooks.ifNotLocal(hook=>{
    if(Array.isArray(hook.result.data) ){
        hook.result.data=hook.result.data.map(team=>{
            //return only related
            return {
                name       : team.name,
                _id        : team._id,
                times      : team.times,
                description: team.description,
                userIds    : team.userIds,
                userId     : team.userId,
                color      : team.color
            }
        });
    }
    return hook
});
*/
/**
 * @param hook - to inject data that are saved in link services
 * @example  {"_id" : "yyyyy", 
    "target" : "localhost:3100/teams/0000d186816abba584714c5f", 
    "createdAt" : ISODate("2018-08-28T10:12:29.131+0000"), 
    "data" : {
        "role" : "teamadministrator", 
        "teamId" : "5bbca16aac074915141a4b75", 
        "invitee" : "test@schul-cloud.org", 
        "inviter" : "0000d224816abba584714c9c"
    }, 
    "__v" : NumberInt(0)}
 */
const injectDataFromLink=(fallback)=>{
    return (hook)=>{
        if(hook.data.shortId && hook.id=='adduser'){
            const linkService  = hook.app.service('link');
            const usersService = hook.app.service('users');
            const teamsService = hook.app.service('teams');

            return linkService.get(hook.data.shortId).then(link=>{
                const teamId = link.data.teamId;
                hook.id      = teamId;           //inject teamId

                delete hook.data.shortId;       //clear it from posted data
                hook.injectLink=link;           //to pass the id for later remove
               
                if(hook.data.userIds===undefined){
                    hook.data.userIds=[];
                }

             
                let waitUser = usersService.find({
                    query:{email:link.data.invitee}
                }).then(users=>{
                    const user = extractOne(users,'Find user by email.');
                    return createUserWithRole(hook,user._id, link.data.role)
                }).catch(err=>{
                    throw new errors.NotFound('No user credentials found.',err);
                });

                let waitTeam = teamsService.get(teamId).then( team=>{
                    return team
                }).catch(err=>{
                    throw new errors.NotFound('No team found.',err);
                });

                return Promise.all([waitUser,waitTeam]).then(data=>{
                    const user          = data[0];
                    const teamUsers     = data[1].userIds;
                    const teamSchoolIds = data[1].schoolIds;
                   
                    //if user already inside
                    if( teamUsers.find(user=>(user.userId||{}).toString() === user._id)!==undefined ){
                        throw new errors.Conflict(err);
                    } 

                    hook.data.userIds = teamUsers.concat(user);
                    if(teamSchoolIds.includes(user.schoolId)===false){  //if user from new user come into this team
                        teamSchoolIds.push(user.schoolId);
                    }
                    hook.data.schoolIds = teamSchoolIds;

                    return hook
                }).catch(err=>{
                    throw new errors.BadRequest(err);
                });
             
            }).catch(err=>{
                throw new errors.NotFound('This link is not valid.',err);
            });
        }else{
            return (typeof fallback==='function' ? fallback(hook) : hook);
        }
    }
}

/**
 * @param hook
 */
const removeLinkFromDB=(hook)=>{
    if(hook.injectLink!==undefined){
        return hook.app.service('link').remove(hook.injectLink._id).then(link=>{
            if(link._id!==undefined){
                return filterRemoveCreateLinkResult(hook);
            }else{
                throw new errors.BadRequest('Link can not removed');
            }
        }).catch(err=>{
            throw new errors.BadRequest('Bad intern call. (4)',err);
        });
    }else{
        return hook
    }
}

/**
 * @param hook
 */
const injectLinkInformationForLeaders=(hook)=>{
    //todo: Take it from link service via find data.teamId
    return hook
}


/**
 * @param hook - Add teamroles to hook.teamroles
 */
const teamRolesToHook = globalHooks.ifNotLocal(hook=>{
    return hook.app.service('roles').find({
        query:{name:/team/i}  
    }).then(roles=>{
        if(roles.data.length<=0){
            throw new errors.NotFound('No team role found. (1)');
        }

        hook.teamroles = roles.data;        //add team roles with permissions to hook   

        hook.findRole  = (key,value,resultKey)=>{     //add a search function to hook
            const self = hook;
            
            if(self.teamroles===undefined){
                throw new errors.NotFound('No team role found. (2)');
            }

            const role = self.teamroles.find(role => role[key].toString()===value.toString());
            if(resultKey){
                return role[resultKey]
            }else if(role){
                return role
            }else{
                throw new errors.NotFound('No team role found. (3)',{key,value:value.toString(),resultKey});
            }
        }

        const method = hook.method;

        if( method !== 'find' ){
            const resolveInheritance = (role,stack=[])=>{         
                stack = stack.concat(role.permissions);
                if(role.roles.length<=0 ) return stack
                const searchRole  = hook.findRole('_id',role.roles[0]);     //take only first target ...more not exist       
                return resolveInheritance(searchRole,stack);
            }
    
            hook.teamroles.forEach(role=>{
                const solvedAllPermissions = resolveInheritance(role);
                role.permissions=solvedAllPermissions;
            });
        }

        return hook
    }).catch(err=>{
        throw new error.BadRequest('Can not resolve team roles.',err);
    });
});

/**
 * @param {*} allowedKeys is a array of strings that can pass, all other are filterd 
 */ /*
const filterQueryKeys = (allowedKeys)=>{
    return globalHooks.ifNotLocal(hook=>{
        //todo: remove all other keys in hook.params.query
        return hook
    });
}
*/
const keys ={
    resFind:['_id','name','times','description','userIds','color'],
    resId:  ['_id'],
    query : ['$populate','$limit'],
    data:   ['name','times','description','userIds','color','features','ltiToolIds','classIds','startDate','untilDate','schoolId']
}

//todo: TeamPermissions
exports.before = {
    all:    [ auth.hooks.authenticate('jwt'), existId,filterToRelated(keys.query,['params','query']),teamRolesToHook ],
    find:   [ restrictToCurrentSchoolAndUser ],
    get:    [ restrictToCurrentSchoolAndUser ],                                //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [ filterToRelated(keys.data,['data']), globalHooks.injectUserId,testInputData,updateUsersForEachClass,restrictToCurrentSchoolAndUser ], //inject is needing?
    update: [ blockedMethode ],
    patch:  [ (injectDataFromLink)(updateUsersForEachClass),filterToRelated(keys.data,['data']),restrictToCurrentSchoolAndUser ],
    remove: [ restrictToCurrentSchoolAndUser ]
};

//todo:clear unused values
//todo: update moongose
exports.after = {
    all:    [],
    find:   [ filterToRelated(keys.resFind,['result','data']) ], // filterFindResult
    get:    [ addCurrentUserWithPermissionsToTopLevel,injectLinkInformationForLeaders ],                                 //see before (?)
    create: [ filterToRelated(keys.resId,['result']) ],
    update: [],                             //test schoolId remove
    patch:  [ addCurrentUserWithPermissionsToTopLevel,removeLinkFromDB ],          //test schoolId remove
    remove: [ filterToRelated(keys.resId,['result']) ]
};
