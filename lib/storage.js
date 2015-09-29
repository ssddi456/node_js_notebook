var fs = require('fs');
var path = require('path');
var cubby = require('cubby');

var storage = new cubby({ file : path.join(__dirname, '../data/storage.json')});
var uuid = require('./uuid');


function init() {
  var note_ids = storage.get('note_ids');
  if( !note_ids ){
    storage.set('note_ids',[]);
  }
}
init();

function check_note_exists ( id ) {
  var note_id = storage.get('note_id.' + id);
  if( note_id ){
    return true;
  }
  return false;
}

module.exports = {
  add : function( id ) {
    id = id || uuid();
    if(!check_note_exists(id)){

      storage.set('note_id.' + id, Date.now());
      var new_note = {
        timestamp : Date.now(),
        id   : id,
        name : 'untitled',
        code : '',
        res  : {}
      };

      storage.set('note.' + id, new_note);

      var note_ids = storage.get( 'note_ids' );
      note_ids.unshift(id);
      storage.set( 'note_ids', note_ids );

      return new_note;
    }
    return false;
  },

  get : function( id ){
    if(check_note_exists(id)){
      return storage.get('note.' + id);
    }
  },

  get_all : function() {
    var note_ids = storage.get('note_ids');
    return note_ids.map(function( id ) {
      return storage.get('note.' + id);
    });
  },

  update : function( id, data ){
    if( check_note_exists(id) ){
      storage.set('note.' + id, data);
      return true;
    }
  },

  remove : function( id ) {
    if( check_note_exists(id) ){
      storage.set('note_id.' + id, null );
      storage.set('note.' + id, null );

      var note_ids = storage.get( 'note_ids' );
      note_ids.splice(note_ids.indexOf(id),1);
      storage.set( 'note_ids', note_ids );

      return true;
    }
  }

};