const errors = require('feathers-errors');
const bcrypt = require('bcryptjs');

const rnd=(max)=>{
	return Math.floor(Math.random() * Math.floor(max));
}	

const rndChar=()=>{
	const chars = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','U','V','W','0','1','2','3','4','5','6','7','8','9'];
	return chars[rnd(chars.length-1)]		
} 

module.exports = function (app) {

	class HashService {
		constructor(options) {
			this.options = options || {};
			this.docs = {};
				
        }
        
		create(data, params) {
			return new Promise( (resolve,reject)=>{
				if( data.toHash==undefined ){ 
					reject(  new errors.BadRequest('Please set toHash key.') ) 
				}
				bcrypt.genSalt(8, function(err, salt) {
					if(err!=null){
						reject(  new errors.BadRequest('Can not create salt.') ) 
					}
					bcrypt.hash(data.toHash, salt, function(err, hash) {
						if(err!=null){
							reject(  new errors.BadRequest('Can not create hash.') ) 
						}
						if(data.save==true){
							hash=hash.replace(/\/|\$|\./g,rndChar());
						}
						resolve(hash);		
					});
				});	
				
			});
		}
	}

	return HashService;
};
