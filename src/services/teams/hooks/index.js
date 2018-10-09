'use strict';

const auth        = require('feathers-authentication');
//const hooks       = require('feathers-hooks');
const errors      = require('feathers-errors');
const logger      = require('winston');
const globalHooks = require('../../../hooks');
const _           = require('lodash');
const mongoose    = require('mongoose');
const Schema      = mongoose.Schema;


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

    return {userId,role,roleName:selectedRole||'teammember'}
}

/**
*   helper
*/
const extractOne = (res) => {
    if (res.data.length == 1) {
        return res.data[0]
    } else {
       // logger.error('extractOne() length!=1');
        if(res.data.length===0){
            throw new errors.NotFound('No team is avaible.');
        }else{
            throw new errors.BadRequest('Bad intern call. (1)');
        } 
    }
}

/**
*   helper
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
    if(hook.data.classIds.length<=0){
        return hook
    }

    //add current userId
    let newUserList = [hook.params.account.userId];   
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
        return extractOne(users);
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
            const index = hook.data.userIds.indexOf(userId);
            const value = createUserWithRole(userId,'teamowner');
            if(index==-1){
                hook.data.userIds.push(value);      //add owner
            }else{
                hook.data.userIds[index]=value;     //replace with obj
            } 

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
            teamsService.find({                     //match test by teamId and userId
                query:{
                    _id     : teamId,
                    userIds : {$elemMatch:{userId}}   
                }
            }).then(teams => {  
                resolve(extractOne(teams));
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

        if (team !== undefined && method !== 'create') {
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
             hook.data.userIds=hook.data.userIds.map((userId_or_userObject)=>{
                 if(typeof userId_or_userObject === 'string'){                      //if userId has no role, it should map to member
                    return createUserWithRole(userId_or_userObject);
                }else if(typeof userId_or_userObject === 'object'){
                    if(userId_or_userObject.role===undefined){
                        return createUserWithRole(userId_or_userObject);
                    }
                    return userId_or_userObject
                }
                //if other type do not pass it
            });
        }

        //todo: create test if teamname in schoolId/s unique 

        return Promise.resolve(hook);
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
 * @param hook - test and update missing data for methodes that contain hook.data
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
 * @method remove
 */
const filterRemoveResult=(hook)=>{
    if(typeof hook.result==='object' && hook.result._id !== undefined){
        hook.result={_id:hook.result._id};
    }
    return hook
}


/**
 * @param hook - clear and map return ressources to related
 * @method find
 */
const filterFindResult=(hook)=>{
    if(typeof hook.result==='object' && Array.isArray(hook.result.data) ){
        hook.result.data.map(team=>{
            //return only related
        });
    }
    return hook
}


/**
 * @param hook - clear and map return ressources to related
 * @moongose   - only for return ressource from moongose model
 * @ifNotLocal - work only for extern requests
 */
const filterMoongoseResult = globalHooks.ifNotLocal(hook=>{
    if(typeof hook.result==='object' && Array.isArray(hook.result.data) ){
        hook.result=hook.result.data;
    }
    return hook
});

//todo: TeamPermissions
exports.before = {
    all: [auth.hooks.authenticate('jwt'), existId],
    find: [restrictToCurrentSchoolAndUser],
    get: [restrictToCurrentSchoolAndUser],                                //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [globalHooks.injectUserId,testInputData,updateUsersForEachClass,restrictToCurrentSchoolAndUser], //inject is needing?
    update: [blockedMethode],
    patch: [testInputData,updateUsersForEachClass,restrictToCurrentSchoolAndUser],
    remove: [restrictToCurrentSchoolAndUser]
};

//todo:clear unused values 
//todo: update moongose 
exports.after = {
    all: [],
    find: [filterMoongoseResult,filterFindResult],                
    get: [],                                 //see before (?)
    create: [],
    update: [],                             //test schoolId remove
    patch: [],          //test schoolId remove
    remove: [filterRemoveResult]
};
