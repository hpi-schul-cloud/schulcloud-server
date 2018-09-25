const mongoose = require('mongoose');
const logger = require('winston');
const getJWT = require('./getJWT');

module.exports = (save)=>{
	logger.info('Create logins data in db...');
	if(process.env.TEST_PW===undefined){
		return Promise.reject('The env variable TEST_PW is not set.');
	}
	if(process.env.TEST_HASH===undefined){
		return Promise.reject('The env variable TEST_HASH is not set.');
	}
	if(save==undefined) save={};
	
	return new Promise( (resolve,reject)=>{
		const roles    = save.roles;
		const schoolId  = mongoose.Types.ObjectId(); //or better create school?
		const password = process.env.TEST_PW.trim(); 	
		const passwordHash = process.env.TEST_HASH.trim(); 
		
		save.logins={};
		const usersSetting = roles.map(role=>{
			const name=role.name;
			save.logins[name]={user:null,account:null,password:password,name:name};
			return {
				roles:role,
				email:role.name+'@hardening-test.de',
				schoolId: save.schoolId,
				firstName: role.name,
				lastName: 'hardening-test',
				schoolId: schoolId
			}		
		});

		logger.info('Create users...');
		mongoose.model('user').create(usersSetting,(err,users)=>{
			if(err) reject(err);
			users.forEach(user=>{
				save.logins[user.firstName].user=user;
			})
			return users
		}).then(users=>{
			const accountsSetting = users.map(user=>{
				return {
					username: user.email,
					password: passwordHash,
					userId:user._id,
					activated:true 		//Extra User für nicht aktiviert?
				}
			});
			logger.info('Create accounts with token...');
			return mongoose.model('account').create(accountsSetting,(err,accounts)=>{
				if(err) reject(err);
				
				let promiseToken=[];
				
				accounts.forEach(account=>{
					const getName = (username)=>{
						let name;
						users.forEach(user=>{
							if(user.email===username)
								name=user.firstName;
						}); //username
						return name
					}

					promiseToken.push(
						getJWT({username:account.username,password}).then( ({Authorization,agent})=>{
							const roleName = getName(account.username);
							save.logins[roleName].account=account;
							save.logins[roleName].Authorization=Authorization;
							save.logins[roleName].agent=agent;
						})
					);						
				});
				
				Promise.all(promiseToken).then(()=>{
					logger.info('Create logins ready!');
					resolve(save);
				});
			});	
		})
	});
}