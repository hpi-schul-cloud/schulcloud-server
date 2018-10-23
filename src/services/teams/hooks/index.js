'use strict';

const auth        = require('feathers-authentication');
const errors      = require('feathers-errors');
const globalHooks = require('../../../hooks');
const Schema      = require('mongoose').Schema;
const logger      = require('winston');


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
        role = hook.findRole('name',selectedRole,'_id');
    }
    if(role===undefined || userId===undefined){
        throw new errors.BadRequest('Wrong input. (2)');
    }

    return {userId,role};
};

/**
*   helper  todo:make a promise that return then the error message must not be passed and make debug faster
*/
const extractOne = (res,errorMessage) => {
    if ( (res.data||{}).length == 1) {
        return res.data[0];
    } else {
        if(res.data.length===0){
            throw new errors.NotFound('The user is not in this team, or no team is avaible.',{errorMessage:errorMessage||''});
        }else{
            throw new errors.BadRequest('Bad intern call. (1)',{errorMessage:errorMessage||''});
        }
    }
};

/**
*   helper
*   @requires const Schema = require('mongoose').Schema;
*/
const testIfObjectId = (id)=>{
    if(id instanceof Schema.Types.ObjectId || id===undefined){
        throw new errors.BadRequest('Wrong input. (5)');
    }
};

/**
 * @param hook - mapped userIds from class to userIds, clear all double userId inputs
 */
const updateUsersForEachClass = (hook) => {
    if( (hook.data.classIds||{}).length<=0 ){
        return hook;
    }

    let newUserList = [hook.params.account.userId];   // //add current userId?
    const add=(id)=>{
        if( newUserList.includes(id)===false){
            testIfObjectId(id);
            newUserList.push(id);
        }
    };
    if(hook.data.classIds===undefined || hook.data.classIds.length<=0){
        return hook;
    }

    return hook.app.service('classes').find({
        query:{$or:hook.data.classIds.map( _id=>{
            testIfObjectId(_id);
            return {_id};
        })}
    }).then(classes=>{
        //add userIds from classes
        classes.data.forEach( classObj=>{
            classObj.userIds.forEach(_id=>{
                add(_id);
            });
        });

        //add userIds from userId list
        hook.data.userIds.forEach(obj_or_id=>{
            add( (typeof obj_or_id==='object' ? obj_or_id.userId : obj_or_id) );
        });
        //update userId list
        hook.data.userIds=newUserList;
        return hook;
    }).catch(err=>{
        logger.warn(err);
        throw new errors.BadRequest('Wrong input. (6)');
    });
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

    /************************
     *  get current user    *
     * **********************/
    const usersService = hook.app.service('users');
    const waitSessionUser     = usersService.find({
        query: {
            _id: sessionUserId,
            $populate: 'roles'
        }
    }).then(users => {
        return extractOne(users,'Find current user.');
    }).catch(err => {
        throw new errors.BadRequest('User can not found.',err);
    });

    /**********************************
     *  get all users from userIds    *
     * ********************************/
   
    const waitUserIds = new Promise((resolve, reject) => {
        if(['create','patch'].includes(method)===false){
            resolve([]);
        }

        const userIds = Array.isArray( hook.data.userIds ) && hook.data.userIds.length>0 ? hook.data.userIds : resolve([]);
        usersService.find({
            query:{
                $or: userIds.reduce((arr,v)=>{
                    arr.push({_id: (typeof v==='object' && v.userId) ? v.userId : v});
                    return arr;
                },[])
            }
        }).then(users=>{
            resolve(users.data);
        }).catch(err=>{
            logger.warn(err);
            reject( new errors.BadRequest('Can not search users.') );
        });
    });


    /********************
     *  get team data   *
     * ******************/
    const teamsService = hook.app.service('teams');
    const waitTeams    = new Promise((resolve, reject) => {
        if (method === 'create' && teamId === undefined) {
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
            const match = {userIds: {$elemMatch:{userId:sessionUserId.toString() }}};
            hook.params.query = match;
            teamsService.find({
                query:match
            }).then(teams=>{
                resolve( teams.data );
            }).catch(err=>{
                logger.error(err);
                reject( new errors.BadRequest('Bad intern call. (2)') );
            });
        } else if (teamId) {    //patch, delete, get
             //if patch sessionUser is not in team, if delete and get sessionUser is in. 
            const query = (method==='patch' ? {_id:teamId} : {_id:teamId, userIds : {$elemMatch:{userId:sessionUserId}}});
            teamsService.find({query}).then(teams => { //match test by teamId and sessionUserId query
                resolve(extractOne(teams,'Find current team.'));
            }).catch(err => {
                err.code===404 ? reject(err) : reject( new errors.BadRequest('Wrong input. (1)',err) );
            });
        }
    });

    /***************
     *   execute    *
     * **************/
    return Promise.all([waitSessionUser, waitTeams,waitUserIds]).then( data => {
        //const inputSchoolId = (hook.data||{}).schoolId || (hook.params.query||{}).schoolId;
        const sessionUser = data[0];
        let   team        = data[1];    //for create it is the team with created data
        const users       = data[2];
        const userIds     = hook.data.userIds;
        const isSuperhero = sessionUser.roles.includes('superhero');

        if (data.length!=3 || sessionUser === undefined || team===undefined || sessionUser.schoolId===undefined) {
            throw new errors.BadRequest('Bad intern call. (3)');
        }
        const sessionSchoolId = sessionUser.schoolId.toString();  //take from user db

        if(isSuperhero===false){
            if(method === 'create'){ 
                hook.data.schoolIds = [sessionSchoolId];  
                team.schoolIds      = [sessionSchoolId];
                users.push(sessionUser);
            }
            // test if session user is in team
            let teamArray=team;
            if (!Array.isArray(teamArray)) {
                teamArray=[team];
            }
            teamArray.forEach(_team=>{              
                if(_team.userIds.includes(sessionUser._id.toString()===false ) ){
                    throw new errors.Forbidden('You do not have valid permissions to access this.(1)');
                }
                if (_team.schoolIds.includes(sessionSchoolId) === false) {
                   // throw new errors.Forbidden('You do not have valid permissions to access this.(2)');
                }
             });            
        }
        
        if( Array.isArray(userIds) &&  userIds.length>0 ){     //hook.data.schoolIds can only inject by links or create, patch should not pass it 
            const schools = (hook.data.schoolIds || team.schoolIds).map(_id=>{
                return _id.toString();
            });   
            //Only users from schools that are related to this team can be passed
            const newUsersIds = users.reduce((arr,user)=>{
                const schoolId = user.schoolId.toString();
                if( schools.includes( schoolId )){
                    const _id    = user.userId || user._id.toString();      
                    let teamUser = team.userIds.find( teamUser=> (teamUser.userId||{}).toString()===_id ); //already inside the team
                    
                    if(teamUser===undefined){
                        teamUser = hook.data.userIds.find(teamUser=> (teamUser.userId||{}).toString()===_id && teamUser.role); // new with role  todo: if role is string and not objectId then match to role with hook.findRole
                    }
                    
                    if(teamUser===undefined){
                        teamUser = createUserWithRole(hook,_id);                                           // new with id
                    }
                    arr.push(teamUser);
                }
                return arr;
            },[]);

            if(newUsersIds.length<=0){
                throw new errors.BadRequest('This request will removed all users for schools in this team. It is blocked. Please use remove to delete this team.');
            }

            hook.data.userIds = newUsersIds;
        }
        //todo: create test if teamname in schoolId/s unique

        return hook;
    });
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
const addCurrentUser=globalHooks.ifNotLocal( (hook)=>{
    if(hook.injectLink){
        return hook;
    }
    if(typeof hook.result==='object' && hook.result._id !== undefined){
        const userId    = hook.params.account.userId.toString();
        const user      = Object.assign({},hook.result.userIds.find( user => (user.userId == userId || user.userId._id == userId) )); 
        if(user.role===undefined){
            logger.warn('[teams]','Can not execute addCurrentUser for unknown user. Or user execute a patch with the result that he has left the team.',{userId});
            return hook;
        }
        testIfObjectId(user.role);
        const role       = hook.findRole('_id',user.role);
        user.permissions = role.permissions;
        user.name        = role.name;
        hook.result.user = user;     
    }
    return hook;
    
});

/**
 * @param hook - test and update missing data for methodes that contain hook.data
 * @method post
 */
const testInputData=hook=>{
    if(hook.data.userIds===undefined){
        hook.data.userIds=[];
    }else if( !(Array.isArray(hook.data.userIds)) ){
        throw new errors.BadRequest('Wrong input. (3)');
    }

    if(hook.data.classIds===undefined){
        hook.data.classIds=[];
    }else if( !(Array.isArray(hook.data.classIds)) ){
        throw new errors.BadRequest('Wrong input. (4)');
    }
    return hook;
};

/**
 * @param hook - block this methode for every request
 */
const blockedMethode=(hook)=>{
    logger.warn('[teams]','Method is not allowed!');
    throw new errors.MethodNotAllowed('Method is not allowed!');
};

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
                    return newObject;
            };};
            if(Array.isArray(data))
                return data.map(element=>{
                    return keys.reduce(reducer(element),{}); 
                });
            else
                return keys.reduce(reducer(data),{}); 
        };
        const result = objectToFilter||hook;
        let link, linkKey;
        let target = path.length>0 ? path.reduce( (target,key)=>{
            if(target[key]===undefined)
                throw new errors.NotImplemented('The path do not exist.');
            const newTarget = target[key];
            link = target;
            linkKey = key;
            return newTarget;
        },result) : result;

        link[linkKey] = filter(target);
 
		return result;
	});
};

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
                    return [createUserWithRole(hook,user._id, link.data.role),user.schoolId];
                }).catch(err=>{
                    throw new errors.NotFound('No user credentials found.',err);
                });

                let waitTeam = teamsService.get(teamId).then( team=>{
                    return team;
                }).catch(err=>{
                    throw new errors.NotFound('No team found.',err);
                });

                return Promise.all([waitUser,waitTeam]).then(data=>{
                    const user          = data[0][0];
                    const schoolId      = data[0][1].toString();
                    const teamUsers     = data[1].userIds;
                    const teamSchoolIds = data[1].schoolIds.map(_id=>{
                        return _id.toString();
                    });  
                   
                    if( teamUsers.find(user=>(user.userId||{}).toString() === user._id)!==undefined ){
                        throw new errors.Conflict('User is already inside.');
                    } 

                    hook.data.userIds = teamUsers.concat(user);

                    if(teamSchoolIds.includes(schoolId)===false){  //if user from new user come into this team
                        teamSchoolIds.push(schoolId);
                    }
                    hook.data.schoolIds = teamSchoolIds;
                    return hook;
                }).catch(err=>{
                    throw new errors.BadRequest(err);
                });
             
            }).catch(err=>{
                throw new errors.NotFound('This link is not valid.',err);
            });
        }else{
            return (typeof fallback==='function' ? fallback(hook) : hook);
        }
    };
};

/**
 * @param hook
 */
const removeLinkFromDB=(hook)=>{
    if(hook.injectLink!==undefined){
        return hook.app.service('link').remove(hook.injectLink._id).then(link=>{
            if(link._id!==undefined){
                const filterFunction = filterToRelated(['_id'],['result']);
                return filterFunction(hook);
            }else{
                throw new errors.BadRequest('Link can not removed');
            }
        }).catch(err=>{
            logger.warn(err);
            throw new errors.BadRequest('Bad intern call. (4)');
        });
    }else{
        return hook;
    }
};

/**
 * @param hook
 */
const injectLinkInformationForLeaders=(hook)=>{
    //todo: Take it from link service via find data.teamId
    return hook;
};


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

            if(key===undefined || value===undefined){
                logger.warn('Bad input for findRole: ',{key,value});
                throw new errors.NotFound('No team role found. (3)');
            }
            if(typeof value==='object' && value._id){      //is already a role ..for example if request use $populate
                value=value[key];
            }
            let role = self.teamroles.find(role => role[key].toString()===value.toString());
            if(resultKey){
                return role[resultKey];
            }else if(role){
                return role;
            }else{
                logger.warn({role,value,resultKey});
                throw new errors.NotFound('No team role found. (4)');
            }
        };

        const method = hook.method;

        if( method !== 'find' ){
            const resolveInheritance = (role,stack=[])=>{         
                stack = stack.concat(role.permissions);
                if(role.roles.length<=0 ) return stack;
                const searchRole  = hook.findRole('_id',role.roles[0]);     //take only first target ...more not exist       
                return resolveInheritance(searchRole,stack);
            };
    
            hook.teamroles.forEach(role=>{
                const solvedAllPermissions = resolveInheritance(role);
                role.permissions=solvedAllPermissions;
            });
        }

        return hook;
    }).catch(err=>{
        throw new errors.BadRequest('Can not resolve team roles.',err);
    });
});

const keys ={
    resFind:['_id','name','times','description','userIds','color'],
    resId:  ['_id'],
    query:  ['$populate','$limit'],
    data:   ['name','times','description','userIds','color','features','ltiToolIds','classIds','startDate','untilDate','schoolId']
};

//todo: TeamPermissions
exports.before = {
    all:    [ auth.hooks.authenticate('jwt'), existId,filterToRelated(keys.query,['params','query']),teamRolesToHook ],
    find:   [ restrictToCurrentSchoolAndUser ],
    get:    [ restrictToCurrentSchoolAndUser ],                                //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [ filterToRelated(keys.data,['data']), globalHooks.injectUserId,testInputData,updateUsersForEachClass,restrictToCurrentSchoolAndUser ], //inject is needing?
    update: [ blockedMethode ],
    patch:  [ (injectDataFromLink)(updateUsersForEachClass),restrictToCurrentSchoolAndUser ], //filterToRelated(keys.data,['data']) 
    remove: [ restrictToCurrentSchoolAndUser ]
};

//todo:clear unused values
//todo: update moongose
exports.after = {
    all:    [],
    find:   [ filterToRelated(keys.resFind,['result','data']) ], // filterFindResult
    get:    [ addCurrentUser,injectLinkInformationForLeaders ],                                 //see before (?)
    create: [ filterToRelated(keys.resId,['result']) ],
    update: [],                             //test schoolId remove
    patch:  [ addCurrentUser,removeLinkFromDB ],          //test schoolId remove
    remove: [ filterToRelated(keys.resId,['result']) ]
};
