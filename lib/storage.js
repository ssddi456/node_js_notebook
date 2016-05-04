var fs = require('fs');
var path = require('path');
var nedb = require('nedb');

var storage = new nedb({ 
                  filename : path.join(__dirname, '../data/storage.db'),
                  autoload : true
                });

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
    storage.find({ is_bootstrap : { $exists : false }}, function( err, notes) {
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
    for(var k in data){
      if( typeof updates != 'object' ){
        updates[k] = data[k]
      } else {
        for(var m in data[k] ){
          updates[k + '.' + m ] = data[k][m];
        }
      }
    }

    storage.update({ _id : id }, { $set : data }, done);
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