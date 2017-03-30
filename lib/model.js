var mongodb = require('mongodb');
var model = module.exports =  function( def ) {

    var update_keys = [];
    var all_keys = [];
    var defaults = {};
    var type = {};

    for(var k in def){
      if( k!= 'id' && k!= '_id' && def.hasOwnProperty(k)){

        all_keys.push(k);

        if( typeof def[k] != 'object' ){
          defaults[k] = def[k];
          update_keys.push(k);
        } else {

          if( 'initial' in def[k] ){
            defaults[k] = def[k].initial;
            if( def[k].type ){
              if( typeof def[k].type != 'function' ){
                throw new Error('illegal type decleration');
              }
              type[k] = def[k].type;
            }

            if( def[k].readonly ){
              // 不接受客户端上传的改动
            } else {
              update_keys.push(k);
            }
          } else {
            defaults[k] = def[k];
            update_keys.push(k);
          }
        }
      }
    }
    var ret = {};

    /**
     * 创建一个数据副本
     */
    ret.create = function( obj ) {
      var ret = {};
      var i =0;
      var len = all_keys.length;
      var k;
      var input;

      obj = obj || defaults;
      for(;i<len;i++){
        k = all_keys[i];

        if( k in obj ){
          input = obj[k];
        } else {
          input = defaults[k];
        }

        if( type[k] ){
          ret[k] = type[k](input);
        } else {
          ret[k] = input;
        }
      }

      return ret;
    };

    /**
     * 将数据输出给客户端
     */
    ret.wrap = function( data ) {
      var ret = {};

      if( data._id ){
        ret.id = data._id;
      }

      var i =0;
      var len = all_keys.length;
      var k;
      for(;i< len;i++){
        k = all_keys[i];
        ret[ k ] = data[ k ];
      }

      return ret;
    };

    /**
     * 读取客户端的可更新数据
     */
    ret.unwrap = function( data ) {
      var ret = {};

      var id = data.id;

      if( id && id.match(/^[0-9a-e]{24}$/i) ){
        id = mongodb.ObjectId(id);
      }
      ret.query = {
        _id : id
      };
      var doc = ret.doc = {};

      var i =0;
      var len = update_keys.length;
      var k;
      var input;

      for(;i< len;i++){
        k = update_keys[i];

        if( k in data ){
          input = data[k];

          if( type[k] ){
            doc[ k ] = type[k]( input );
          } else {
            doc[ k ] = input;
          }
        }

      }

      return ret;
    };

    return ret;
}
