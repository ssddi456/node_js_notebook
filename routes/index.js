var express = require('express');
var router = express.Router();
var storage = require('../lib/storage');

var debug = require('debug')('index');

var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {

  async.auto({
    init_bootstrap : function( done, res ) {
      storage.get_bootstrap(done);
    },
    init_notes : function( done, res ) {
      storage.get_all(done);
    }
  }, function( err, notes_info ) {
    if(err){
      return next(err);
    }
    res.render('index', { 
      title: 'Node Note', 
      notes: notes_info.init_notes,
      bootstrap: notes_info.init_bootstrap
    });
  });
});

module.exports = router;
