const request = require('request-promise-native');
const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const logger = require('winston');

const RocketChatModel = require('./model');
const hooks = require('./hooks');
const docs = require('./docs');


const REQUEST_TIMEOUT = 4000; // in ms
const ROCKET_CHAT_URI = process.env.ROCKET_CHAT;

class RocketChat {
	constructor(options) {
		this.options = options || {};
		this.docs = docs;
    }  

    generatePass(){
        return '123';
    }

    create(data,params){
        const userId = data.userId;
        if(userId===undefined)
            throw new errors.BadRequest('Missing data value.');
            
        return this.app.service('users').get(userId,{$populate:"schoolId"}).then(user=>{
            const email = user.email;
            const pass = this.generatePass();
            const username = [user.schoolId,user.firstName,user.lastName].join('.');
            const name = [user.firstName,user.lastName].join('.');

            return RocketChatModel.create({userId,pass}).then( (err,res)=>{
                if(err)
                    throw err;
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
               
                return request(options).catch(err=>{
                    throw err;
                });   
            });
        }).catch(err=>{
            logger.warn(err);
            throw new errors.BadRequest('Can not create RocketChat Account');
        });
    }

    get(userId,params){

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
    
    app.use('/rocketChat', service(new RocketChat()));
    
    const rocketChatService = app.service('/rocketChat');

    rocketChatService.before(hooks.before);
	rocketChatService.after(hooks.after);
};