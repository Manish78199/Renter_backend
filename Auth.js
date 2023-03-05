const jwt = require("jsonwebtoken")
function authuser(passhash) {
   try {
      return jwt.verify(passhash, "manishpawlikhurd@gmail.com").userId
   } catch (error) {
      return " "
   }

}

function tokenToId(toke) {
   try {
      return jwt.verify(toke, "manishpawlikhurd@gmail.com")
   } catch (error) {
      return " "
   }
}

module.exports.authuser = authuser;
module.exports.tokenToId = tokenToId;
