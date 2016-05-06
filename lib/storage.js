var fs = require('fs');
var path = require('path');
var nedb = require('nedb');

var storage = new nedb({ 
                  filename : path.join(__dirname, '../data/storage.db'),
                  autoload : true
                });

storage.persistence.setAutocompactionInterval(3*60*1e3);

var _storage = module.exports = {
  add : function( done ) {
    var note = {
      timestamp : Date.now(),
      name : 'untitled',
      code : '',
      res  : {}
    };
    storage.insert(note, done);
  },

  get : function( id, done ){
    storage.findOne({
      _id : id
    }, done);
  },

  get_all : function( done ) {
    storage.find({ is_bootstrap : { $exists : false }})
      .sort({ timestamp : -1 })
      .exec(function( err, notes) {
        if( err ){ return done(err); }
        if( !notes || !notes.length ){
          _storage.add(function( err, note ) {
            done(err, [note]);
          });
        } else {
          done(err, notes);
        }
      });
  },

  update : function( id, data, done ){
    var updates = {};
    if( typeof data == 'object' ){

      for(var k in data){
        if( typeof data[k] != 'object' ){
          updates[k] = data[k];
        } else {
          for(var m in data[k] ){
            updates[k + '.' + m ] = data[k][m];
          }
        }
      }
    } else if( typeof data == 'string' ){
      updates.code = data
    }

    updates.timestamp = '' + Date.now();
    storage.update({ _id : id }, { $set : updates }, done);
  },

  get_bootstrap : function( done) {
    storage.findOne({ is_bootstrap : 1}, function( err, doc ) {
      if( err ){ return done(err); }

      if( !doc ){
        storage.insert({
          is_bootstrap : 1,
          code         : ''
        }, done);
      } else {
        done(err, doc);
      }
    });      
  },

  update_bootstrap : function( code, done ) {
    storage.update({ is_bootstrap : 1 }, { $set : { code : code }}, done);
  },

  storage : storage,

  remove : function( id, done ) {
    storage.remove({ _id : id },done);
  }
};