var express = require('express');
var router = express.Router();
var storage = require('../lib/storage');

/* GET home page. */
router.get('/', function(req, res, next) {
  var notes= storage.get_all();

  if( !notes.length ){
    storage.add();
    notes = storage.get_all();
  }

  res.render('index', { title: 'Node Note', notes: notes });
});

module.exports = router;
