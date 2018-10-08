'use strict';

const auth   = require('feathers-authentication');
//const hooks       = require('feathers-hooks');
const errors = require('feathers-errors');
const logger      = require('winston');
const globalHooks = require('../../../hooks');
const _      = require('lodash');



const createUserWithRole=(userId,selectedRole)=>{
    const roles={
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

/** !!!todo: update for teams!!! **/

/**
 * adds all students to a team when a class is added to the team
 * @param hook - contains created/patched object and request body
 */
const addWholeClassToTeam = (hook) => {
    let requestBody = hook.data;
    let team = hook.result;
    if ((requestBody.classIds || []).length > 0) { // just team do have a property "classIds"
        return Promise.all(requestBody.classIds.map(classId => {
            return ClassModel.findById(classId).exec().then(c => c.userIds);
        })).then(studentIds => {
            // flatten deep arrays and remove duplicates
            studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

            // add all students of classes to team, if not already added
            return Promise.all(studentIds.map(s => {
                if (!_.some(team.userIds, u => JSON.stringify(u) === JSON.stringify(s))) {
                    return TeamModel.update({ _id: team._id }, { $push: { userIds: s } }).exec();
                } else {
                    return {};
                }
            })).then(_ => hook);
        });
    } else {
        return hook;
    }
};


/** !!!todo: update for teams!!! **/

/**
 * deletes all students from a team when a class is removed from the team
 * this function goes into a before hook before we have to check whether there is a class missing
 * in the patch-body which was in the team before
 * @param hook - contains and request body
 */
const deleteWholeClassFromTeam = (hook) => {
    let requestBody = hook.data;
    let teamId = hook.id;
    return TeamModel.findById(teamId).exec().then(team => {
        if (!team) return hook;

        let removedClasses = _.differenceBy(team.classIds, requestBody.classIds, (v) => JSON.stringify(v));
        if (removedClasses.length < 1) return hook;
        return Promise.all(removedClasses.map(classId => {
            return ClassModel.findById(classId).exec().then(c => (c || []).userIds);
        })).then(studentIds => {
            // flatten deep arrays and remove duplicates
            studentIds = _.uniqWith(_.flattenDeep(studentIds), (e1, e2) => JSON.stringify(e1) === JSON.stringify(e2));

            // remove all students of classes from team, if they are in team
            return Promise.all(studentIds.map(s => {
                if (!_.some(team.userIds, u => JSON.stringify(u) === JSON.stringify(s))) {
                    return TeamModel.update({ _id: team._id }, { $pull: { userIds: s } }).exec();
                } else {
                    return {};
                }
            })).then(result => {

                // also remove all students from request body for not reading them in after hook
                requestBody.userIds = _.differenceBy(requestBody.userIds, studentIds, (v) => JSON.stringify(v));
                hook.data = requestBody;
                return hook;
            });
        });
    });
};

const extractOne = (res) => {
    if (res.data.length == 1) {
        return res.data[0]
    } else {
       // logger.error('extractOne() length!=1');
        throw new errors.BadRequest('Bad intern call. (1)');
    }
}

const extractMultiple = (res) =>{
    if(res.data.length>0){
        return res.data
    }else{
       // logger.error('extractMultiple(), No team is avaible.');
        throw new errors.NotFound('No team is avaible.');
    }
}

const restrictToCurrentSchoolAndUser = globalHooks.ifNotLocal(hook => {
    const id     = hook.id;
    const method = hook.method;
    const userId = hook.params.account.userId;

    //get user
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

    //get team 
    const teamsService = hook.app.service('teams');
    const waitTeams = new Promise((resolve, reject) => {
        if (method === 'create' && id === undefined) {

            //set owner
            const index = hook.data.userIds.indexOf(userId);
            const value = createUserWithRole(userId,'teamowner');
            if(index==-1){
                hook.data.userIds.push(value);      //add owner
            }else{
                hook.data.userIds[index]=value;     //replace with tuple
            } 

            hook.data.features=['isTeam'];          

            resolve();       //team do not exist
        } else if (method === 'find' && id === undefined) {     //!!Abhängigkeit von token und query userId wird nicht geprüft -> to be discuss!
            //return teams 
            const i=userId;
            teamsService.find({
                query:{
                    userIds:{$elemMatch:{userId}}
                }
            }).then(teams=>{
                resolve( extractMultiple(teams) );
            }).catch(err=>{ 
                err.code===404 ? reject(err) : reject( new errors.BadRequest('Bad intern call. (2)',err) ); //pass valid error response 404 for no team found
            });          
        } else if (id) {
            teamsService.get(id).then(teams => {    //but for user with id and schoolId
                resolve(extractOne(teams));
            }).catch(err => {        
                reject( new errors.BadRequest('Wrong input. (1)',err) );
            });
        }
    });

    return Promise.all([waitUser, waitTeams]).then( data => {
        //const inputSchoolId = (hook.data||{}).schoolId || (hook.params.query||{}).schoolId;
        const user = data[0];
        const team = data[1];
        if (data.length!=2 || user === undefined) {
            throw new errors.BadRequest('Bad intern call. (3)');
        }
        const schoolId = user.schoolId.toString();  //take from user db
        

        if (schoolId === undefined) {
            throw new errors.BadRequest('User has no school.');
        }
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
                    return createUserWithRole(userId);
                }else if(typeof userId_or_userObject === 'object'){
                    return userId_or_userObject
                }
                //if other type do not pass it
            });
        }

        //todo: create test if teamname in schoolId/s unique 
        
        return Promise.resolve(hook);
    })
});

const existId = (hook) => {
    if (['find', 'create'].includes(hook.method)) {
        return Promise.resolve(hook);
    } else if (!hook.id) {
        throw new errors.Forbidden('Operation on this service requires an id!');
    } else {
        return Promise.resolve(hook);
    }
};

const testInputForCreate=hook=>{
    const data=hook.data;
    //todo: ?
    return hook
}


//todo: TeamPermissions
exports.before = {
    all: [auth.hooks.authenticate('jwt'), existId, restrictToCurrentSchoolAndUser],
    find: [],
    get: [],                                //no course restriction becouse circle request in restrictToCurrentSchoolAndUser (?)
    create: [globalHooks.injectUserId,testInputForCreate],
    update: [],
    patch: [deleteWholeClassFromTeam],
    remove: []
};

//todo:clear unused values 
//todo: update moongose 
exports.after = {
    all: [],
    find: [],                               //todo: filter related
    get: [],                                 //see before (?)
    create: [addWholeClassToTeam],
    update: [],                             //test schoolId remove
    patch: [addWholeClassToTeam],         //test schoolId remove
    remove: []
};
