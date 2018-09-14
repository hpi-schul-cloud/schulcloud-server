const mongoose = require('mongoose');

module.exports = (data)=>{
	return new Promise( (resolve,reject)=>{
		const loginKeys = Object.keys( data.logins );
		let rAccountsIds= [];
		let rUserIds	= [];
		
		loginKeys.forEach(loginKey=>{
			const login     = data.logins[loginKey];
			rUserIds.push( login.user._id );
			rAccountsIds.push( login.account._id );
		});

		const wait1 = mongoose.model('user').remove({_id:
			{$in:rUserIds}
		},(err,response)=>{
			if(err) reject(err);
			return Promise.resolve();
		});
		
		const wait2 = mongoose.model('account').remove({_id:
			{$in:rAccountsIds}
		},(err,response)=>{
			if(err) reject(err);
			return Promise.resolve();
		});
		
		Promise.all([wait1,wait2]).then(()=>{
			resolve();
		});
		
	}).catch(err=>{
		console.log('Can not clear data after test is run.',err);
	});
	
}