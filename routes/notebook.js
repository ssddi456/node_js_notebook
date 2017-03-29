var path = require('path');
var express = require('express');
var util = require('util');
var fs = require('fs');
var router = express.Router();

var debug = require('debug')('router/notes');

var fs = require('fs');
var path = require('path');
var nedb = require('nedb');

var storage = new nedb({ 
                  filename : path.join(__dirname, '../data/notebook.db'),
                  autoload : true
                });

var model = require('../lib/model');
storage.persistence.setAutocompactionInterval(3*60*1e3);
var uuid = require('../lib/uuid');

var model_notebook = model({
  name : '',
  desc : '',
  createAt : {
    readonly : true
  }
});

var model_note = model({
  parent_id : '',
  type : '',
  code : {
    type : function( code ) {
        return encodeURIComponent(code);
    }
  },
  order : 0,
  visible : 1,
  // 应该只有值类型
  context : {},
});

/* GET users listing. */
router.get('/notebookset', function(req, resp, next) {
  storage.find({}, function( err, docs ) {
    if( !err ){
      res.json({
        err : 0,
        notebooks: docs.map(model_notebook.wrap)
      });
    } else {
      next(err);
    }
  })
});

router.get('/notebook', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;

  if( !query.id ){
    throw new Error('illegal input');
  }

  query = { _id : query.id };

  storage.findOne( query, function( err, doc ) {
      
      if( !err && doc ) {
        resp.json({ 
          err : 0,
          notebook : model_notebook.wrap(doc)
        });
      } else {
        next(err);
      }
  });
});

router.post('/notebook/add', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;


  query = { _id : query.id };
  
  var doc = model_notebook.create(body);
  doc.createAt = Date.now();

  storage.insert( doc, function( err, doc ) {
     if( !err  ) {
        resp.json({
          err : 0,
          notebook : model_notebook.wrap(doc)
        });
      } else {
        next(err);
      }
  });
});

router.post('/notebook', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  if( !query.id ){
    throw new Error('illegal input');
  }

  query = { _id : query.id };
  
  var notebook_doc = model_notebook.unwrap(body);
  storage.findOne( query, function( err, doc ) {
     if( !err && doc ) {
        storage.update(query, notebook_doc.doc, function( err ) {
          if( !err ){
            resp.json({ 
              err : 0
            });
          } else {
            next(err);
          }
        });
      } else {
        next(err);
      }
  });
});


router.get('/notebook/:id/', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !query.id ){
    throw new Error('illegal input');
  }

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.find({ parent_id : params.id }, function( err, docs ) {
          if( !err )  {
              resp.json({
                err : 0,
                notes : docs.map(model_note.wrap)
              });
          } else {
            next(err);
          }
        })
      } else {
        next(err);
      }

  });
});

router.post('/notebook/:id/add', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !query.id ){
    throw new Error('illegal input');
  }

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.insert( model_note.create({ parent_id : params.id }), 
          function( err, doc ) {
            if( !err )  {
              resp.json({
                err : 0,
                note : model_note.wrap(doc)
              });
            } else {
              next(err);
            }
          })
      } else {
        next(err);
      }

  });
});

router.post('/notebook/:id/note/:note_id', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !query.id ){
    throw new Error('illegal input');
  }

  query = { 
    _id : params.id,
    parent_id : params.note_id
  };

  var note_doc = model_notebook.unwrap(body);
  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.update(query, note_doc.doc, function( err ) {
          if( !err ){
            resp.json({ 
              err : 0
            });
          } else {
            next(err);
          }
        });
      } else {
        next(err);
      }

  });
});


// 
// 执行代码需要弄到一个队列里。
// 每一个笔记本一个队列（实际上可能就一个笔记本）
// 每个note一个子队列（似乎没有意义？）
// 
router.post('/notebook/:id/exec', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;

  query = { _id : params.id };

  // 这里需要依次执行这个notebooks里的所有任务
  storage.findOne( query, function( err, doc ) {
    if( !err && doc ) {
      resp.json({ err : 0 });
    } else {
      next();
    }
  });

});

router.post('/notebook/:id/note/:note_id/exec', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  
  query = { 
    _id : params.id,
    parent_id : params.note_id
  };

  storage.findOne( query, function( err, doc ) {
    if( !err && doc ) {
      resp.json({ err : 0 });
    } else {
      next();
    }
  });

});

