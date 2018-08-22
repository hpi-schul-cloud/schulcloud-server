const errors = require('feathers-errors');
const bcrypt = require('bcryptjs');

module.exports = function (app) {

	class HashServices {
		constructor(options) {
			this.options = options || {};
			this.docs = {}
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
						resolve(hash);		
					});
				});	
				
			});
		}
	}

	return HashServices;
};
