var storage = require('../lib/storage');

var notes = require('../data/storage');
var async = require('async');

async.eachSeries(notes.note_ids, 
  function( id, done) {
    var note = notes['note.' + id];
    storage.storage.insert( note, done);
  },
  function(err) {
    if( !err ){
      console.log( 'all done' );
    }
  });
