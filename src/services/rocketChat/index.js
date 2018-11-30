const request = require('request-promise-native');
//const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const logger = require('winston');

const RocketChatModel = require('./model');
const hooks = require('./hooks');
const docs = require('./docs');
const {randomPass} = require('./randomPass');


const REQUEST_TIMEOUT = 4000; // in ms
const ROCKET_CHAT_URI = process.env.ROCKET_CHAT;

if(ROCKET_CHAT_URI===undefined)
    throw new errors.NotImplemented('Please set process.env.ROCKET_CHAT.');

class RocketChat {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
    }  

    //todo secret for rocketChat
    create(data,params){
        const userId = data.userId;
        if(userId===undefined)
            throw new errors.BadRequest('Missing data value.');
        
        const internalParams = {
            query:{$populate:"schoolId"}
        };
        return this.app.service('users').get(userId,internalParams).then(user=>{
            const email = user.email;
            const pass = randomPass();
            const username = ([user.schoolId.name,user.firstName,user.lastName].join('.')).replace(/\s/g,'_');
            const name = [user.firstName,user.lastName].join('.');

            return RocketChatModel.create({userId,pass,username}).then( (res)=>{
                if(res.errors!==undefined)
                    throw new errors.BadRequest('Can not insert into collection.',res.errors);
                const options = {
                    uri: ROCKET_CHAT_URI + '/api/v1/users.register',
                    method: 'POST',
                  //  headers: {
                   //     'Authorization': process.env.ROCKET_CHAT_SECRET
                   // },
                    body: {email,pass,username,name},
                    json: true,
                    timeout: REQUEST_TIMEOUT
                };   
               
                return request(options).then(res=>{
                    if(res.success===true && res.user!==undefined)
                        return res;
                    else
                        throw new errors.BadRequest('False response data from rocketChat');
                }).catch(err=>{
                    throw new errors.BadRequest('Can not write user informations to rocketChat.',err);
                });   
            });
        }).catch(err=>{
            logger.warn(err);
            throw new errors.BadRequest('Can not create RocketChat Account');
        });
    }

    //todo: username nicht onfly generiert 
    get(userId,params){

        return new Promise((resolve,reject)=>{
            RocketChatModel.findOne({userId},{'username':1, 'pass':1, '_id':0}, (err,login)=>{
                if(err)
                    reject(new errors.BadRequest('Can not found user.',err));
    
                const options = {
                    uri: ROCKET_CHAT_URI + '/api/v1/login',
                    method: 'POST',
                      //  headers: {
                       //     'Authorization': process.env.ROCKET_CHAT_SECRET
                       // },
                    body: {username:login.username,password:login.pass},
                    json: true,
                    timeout: REQUEST_TIMEOUT
                };  
    
                request(options).then(res=>{
                    const authToken = (res.data||{}).authToken;
                    if(res.status==="success" && authToken!==undefined)
                        resolve({authToken});
                    else
                        reject(new errors.BadRequest('False response data from rocketChat')); 
                }).catch(err=>{
                    reject(new errors.Forbidden('Can not take token from rocketChat.',err));
                });   
            });
        }).catch(err=>{
            logger.warn(err);
            throw new errors.Forbidden('Can not create token.');
        });
    }

    patch(userId,data,params){

    }
    
	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;
	/*const options = {
		Model: model,
		paginate: {
			default: 1,
			max: 1
		},
		lean: true
    }; */
    
    app.use('/rocketChat', new RocketChat());
    
    const rocketChatService = app.service('/rocketChat');

    rocketChatService.before(hooks.before);
	rocketChatService.after(hooks.after);
};