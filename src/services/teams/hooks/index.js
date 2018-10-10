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
        if(typeof permsissions==='string'){
            permsissions=[permsissions];
        }
    };
};
exports.hasTeamPermission=hasTeamPermission;    //to use it global

/**
*   helper
*/
const createUserWithRole=(userId,selectedRole)=>{
    const roles={                                   /*@hardcoded, need update if role services created!  */
        teammember:'5bb5c190fb457b1c3c0c7e0f',
        teamexpert:'5bb5c391fb457b1c3c0c7e10',
        teamleader:'5bb5c49efb457b1c3c0c7e11',
        teamadministrator:'5bb5c545fb457b1c3c0c7e13',
        teamowner :'5bb5c62bfb457b1c3c0c7e14'
    };
    let role;

    if(selectedRole===undefined){
        role=roles.teammember;
    }else{
        role=roles[selectedRole];
    }
    if(role===undefined || userId===undefined){
        throw new errors.BadRequest('Wrong input. (2)');
    }

    return {userId,role}    //,roleName:selectedRole||'teammember'
}

/**
*   helper
*/
const extractOne = (res,errorMessage) => {
    if (res.data.length == 1) {
        return res.data[0]
    } else {
        if(res.data.length===0){
            throw new errors.NotFound('The user is not in this team, or no team is avaible.',{errorMessage});
        }else{
            throw new errors.BadRequest('Bad intern call. (1)');
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
    if(!hook.data.classIds || hook.data.classIds.length<=0){
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
    const userId = hook.params.account.userId;

    /********************
     *  get user data   *
     * ******************/
    const usersService = hook.app.service('users');
    const waitUser     = usersService.find({
        query: {
            _id: hook.params.account.userId,
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

            const index = hook.data.userIds.indexOf(userId);
            const value = createUserWithRole(userId,'teamowner');
            if(index==-1){
                hook.data.userIds.push(value);      //add owner
            }else{
                hook.data.userIds[index]=value;     //replace with obj
            }

            //add team flag
            hook.data.features=['isTeam'];

            resolve();       //team do not exist
        } else if (method === 'find' && teamId === undefined) {     //!!Abhängigkeit von token und query userId wird nicht geprüft -> to be discuss!
            //return teams
            teamsService.find({
                query:{
                    userIds: {$elemMatch:{userId}}
                }
            }).then(teams=>{
                resolve( teams.data );
            }).catch(err=>{
               reject( new errors.BadRequest('Bad intern call. (2)',err) );
            });
        } else if (teamId) {
            const _id=teamId;
            teamsService.find({                     //match test by teamId and userId
                query: (method==='patch' ? {_id} : {_id,userIds : {$elemMatch:{userId}}})  //if patch user is not in team, if delete and get user is in. 
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
        const user = data[0];
        let   team = data[1];
        if (data.length!=2 || user === undefined) {
            throw new errors.BadRequest('Bad intern call. (3)');
        }
        if (user.schoolId === undefined) {
            throw new errors.BadRequest('User has no school.');
        }
        const schoolId = user.schoolId.toString();  //take from user db

        /* todo: superhero
        let access = false;
        //superhero can pass it
        user.roles.map(role => {
            if (role.name === 'superhero') {
                access = true;
            }
        });

        if (access) {
            return Promise.resolve(hook);
        } */

        if (team !== undefined && (method !== 'create'||methode !== 'patch')) {
            //test if asked school in team
            if(!Array.isArray(team)){
                team=[team];
            }
            team.forEach(_team=>{
                if (_team.schoolIds.includes(schoolId) === false) {
                    throw new errors.Forbidden('You do not have valid permissions to access this.(1)');
                }
            });


            //test if user in team
          //  const userIsInTeam
         //   if (Object.values(team.userIds).include(user._id) === false) {
         //       throw new errors.Forbidden('You do not have valid permissions to access this.(2)');
         //   }
        }

        //add current schoolId to hook
        //todo: maybe schoolId can pass in every case to hook.data.schoolId
        //todo2: maybe it work better to create test if is already set and rejected, after it set one time
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

        //move to additonal hook?
        //map userIds to {userId:teamRoleId} tupel
        if(hook.data.userIds!==undefined && hook.data.userIds.length>0){
             hook.data.userIds=hook.data.userIds.map((id_or_obj)=>{
                 //map object ids to strings
                if(id_or_obj._bsontype==='ObjectID' || typeof id_or_obj === 'string' ){
                    return createUserWithRole(id_or_obj.toString());
                }else if(typeof id_or_obj === 'object'){
                    id_or_obj.userId = id_or_obj.userId.toString();
                    if(id_or_obj.role===undefined){        
                        return createUserWithRole(id_or_obj.userId);
                    }else{
                        return id_or_obj
                    }
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
const injectCurrentUserToTopLevel= (hook)=>{
    if(typeof hook.result==='object' && hook.result._id !== undefined){
        const userId    = hook.params.account.userId.toString();
        const userIdObj = hook.result.userIds.find( user => (user.userId == userId || user.userId._id == userId) );
        return hook.app.service('roles')
        .get(userIdObj.role)
        .then(role=>{
            userIdObj.permissions=role.permissions;
            userIdObj.name=role.name;
            hook.result.user=userIdObj;
            return hook;
        });
    }
};

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
 * @method remove,create
 * @after hook
 */
const filterRemoveCreateResult=(hook)=>{
    if(typeof hook.result==='object' && hook.result._id !== undefined){
        hook.result={_id:hook.result._id};
    }
    return hook
}

/**
 * @param hook - clear and map return ressources to related
 * @method find
 * @after hook
 * @requires hook.filterMoongoseResult
 */
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
                userId     : team.userId
            }
        });
    }
    return hook
});

/**
 * @param hook - clear and map return ressources to related
 * @moongose   - only for return ressource from moongose model
 * @ifNotLocal - work only for extern requests
 * @after hook
 */
const filterMoongoseResult = globalHooks.ifNotLocal(hook=>{
    if(typeof hook.result==='object' && Array.isArray(hook.result.data) ){
        hook.result=hook.result.data;
    }
    return hook
});

/**
 * @param hook - to inject data that are saved in link services
 * @requires injectLinkData||updateUsersForEachClass - to execute updateUsersForEachClass if no link must be inject
 * @example {
    "_id" : "yyyy",
    "target" : "localhost:3100/teams/0000d186816abba584714c5f",
    "createdAt" : ISODate("2018-08-28T10:12:29.131+0000"),
    "data" : {
        "role" : "5bb5c545fb457b1c3c0c7e13",
        "teamId" : "5bbb13541fe9ec2d1c462535",
        "invitee" : "user@schul-cloud.org",
        "inviter" : "0000d224816abba584714c9c"
    },
    "__v" : NumberInt(0)
}
 */
const injectDataFromLink=(fallback)=>{
    return (hook)=>{
        if(hook.data.shortId && hook.id=='adduser'){
            return hook.app.service('link').get(hook.data.shortId).then(link=>{
                hook.id=link.data.teamId;       //inject teamId

                delete hook.data.shortId;       //clear it from posted data
                hook.injectLink=link;           //to pass the id for later remove
                if(hook.data.userIds===undefined){
                    hook.data.userIds=[];
                }

                hook.app.service('users').find({
                    query:{email:link.data.invitee}
                }).then(users=>{
                    const user=extractOne(users,'Find user by email.');
                    hook.data.userIds.push( createUserWithRole(user._id, link.data.role) );
                    return hook
                }).catch(err=>{
                    throw new errors.NotFound('No user credentials found.',err);
                });
            }).catch(err=>{
                throw new errors.NotFound('This link is not valid.',err);
            });
        }else{
            return fallback(hook)
        }
    }
}

/**
 *
 * @param hook
 */
const removeLink=(hook)=>{
    if(hook.injectLink!==undefined){
        return hook.app.service('link').remove(hook.injectLink._id).then(link=>{
            if(link.data._id!==undefined){
                return hook
            }
        }).catch(err=>{
            throw new errors.BadRequest('Bad intern call. (4)');
        });
    }else{
        return hook
    }
}

const injectLinkInformationForLeaders=(hook)=>{
    //todo: Take it from link service via find data.teamId
    console.log('todo: link data ')
    return hook
}

//todo: TeamPermissions
exports.before = {
    all: [auth.hooks.authenticate('jwt'), existId],
    find: [restrictToCurrentSchoolAndUser],
    get: [restrictToCurrentSchoolAndUser],                                //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [globalHooks.injectUserId,testInputData,updateUsersForEachClass,restrictToCurrentSchoolAndUser], //inject is needing?
    update: [blockedMethode],
    patch: [(injectDataFromLink)(updateUsersForEachClass),restrictToCurrentSchoolAndUser],
    remove: [restrictToCurrentSchoolAndUser]
};

//todo:clear unused values
//todo: update moongose
exports.after = {
    all: [],
    find: [filterFindResult],
    get: [injectCurrentUserToTopLevel,injectLinkInformationForLeaders],                                 //see before (?)
    create: [filterRemoveCreateResult],
    update: [],                             //test schoolId remove
    patch: [injectCurrentUserToTopLevel,removeLink],          //test schoolId remove
    remove: [filterRemoveCreateResult]
};
