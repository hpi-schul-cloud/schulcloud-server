/** 

	execute with mocha ----delay and force test run with run()
	
**/
const mongoose = require('mongoose');
const logger = require('winston');

const host=process.env.HOST||'http://localhost:3030';
const showErrorNotes = false;
const showResponse = true;
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();
const {getAllRoutes,createLogins,clearLogins,importDescriptionsHelper,readConfig} = require('./components/');


/************************************ 
 *	Defined test for each method.	*
 ************************************/
 //methods: [ 'find', 'post', 'get', 'put', 'patch', 'delete' ]
let tests={};
tests.find = (route,login)=>{ 	
	const {id,query,code,response,data} = readConfig('find',route,login);
	//console.log(id,query,code,response,data);
	
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{		//replace with which code is expected 
		login.agent
		.get(route.route)
		.set('Authorization',login.Authorization)
		.query(query)
		.end((err, response)=>{
			if(showResponse){
				logger.info(err ? '[error]\n' : '[success]\n',response.status+'\n',response.body);
			}
			if(err) done(err);
						
			if(response.body.data){
				response.body.data.should.be.a('array');
			}
			//should.not.exist(err);
			response.should.have.status(code);
			done();
		});
	})
}

tests.post = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.get = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.put = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.patch = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.delete = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}


/**************************************** 
 *	Execute every task step by step		*
 ****************************************/
 let rollback;
//create login accounts
new Promise( (resolve,reject)=>{
	logger.info('Request existing roles...');
	mongoose.model('role').find({},(err,roles)=>{
		if(err){
			logger.error('Can not read roles.',err);
			reject(err);
		}
		resolve(roles);
	});
}).then(roles=>{	
	return createLogins({
		roles:roles,
		routes:getAllRoutes()
	}).catch(err =>{
		logger.error('Can not create login data',err);
		throw err
	});		
}).then(data=>{
	rollback=data;		//pass login data to catchs for clear it
	const iDH=importDescriptionsHelper({roles:data.roles,showErrorNotes});
	const updateData=iDH(data);
	//console.log(updateData);
	return updateData;
	
})
.catch(err=>{
	logger.error('Test data can not create.',err);
	logger.info('Try to clear all data from db.');
	clearLogins(rollback);
})
.then(data=>{		
	//execute tests
	describe('route testing.. \n', ()=> {
		const routeKeys = Object.entries( data.routes );
		const loginKeys = Object.entries( data.logins );
		routeKeys.forEach( ([routeKey,route])=>{	
			describe('['+route.name+']\n', ()=> {
					//execute every role for every existing methods 
					route.methods.forEach(method=>{
						describe('		<'+method+'>\n', ()=> {
							loginKeys.forEach(([loginKey,login])=>{
								if(tests[method]){						
									tests[method](route,login);
								}else{
									throw new Error('The methode '+method+' is not defined. Only '+Object.keys(tests).join(',')+' are defined.');
								}
							});
						}); //describe close
					});	
				
			}); //describe close	
		});	

		after( ()=>{
			logger.info('Clear login data from db...');
			return clearLogins(data);
		});
	});
	
	
	run();	//force to start tests 
	
}).catch(err=>{
	logger.error('Test can not execute.',err);
	logger.info('Try to clear all data from db.');
	clearLogins(rollback);
	//clear other data
});
