var crypto = require('crypto');


function uuid() {
  var md5sum = crypto.createHash('md5');
  md5sum.update( Date.now() +'secret' + Math.random() );
  var md5_1 = md5sum.digest('base64').toUpperCase();
  md5sum = crypto.createHash('md5');
  md5sum.update( md5_1 + Math.random() );
  return md5sum.digest('base64').replace(/[^a-zA-Z0-9]/g,'');
}
module.exports = uuid;