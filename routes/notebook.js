var path = require('path');
var exec_code = require('../lib/exec_code');
var express = require('express');
var util = require('util');
var fs = require('fs');
var router = module.exports = express.Router();

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
    readonly : true,
    initial : 0
  }
});

var model_note = model({
  parent_id : {
    type : String,
    initial : ''
  },
  type : {
    type : String,
    initial : ''
  },
  code : {
    type : function( code ) {
        return encodeURIComponent(code);
    },
    initial : ''
  },
  order : {
    type : Number,
    initial : 0
  },
  visible : {
    type : Number,
    initial : 1
  },
  // 应该只有值类型
  context : {},
});

router.get('/', function(req, resp, next) {


  resp.render('bookpage', { 
    title: 'Node Note'
  });

});

/* GET users listing. */
router.get('/notebookset', function(req, resp, next) {
  storage.find({}, function( err, docs ) {
    if( !err ){
      resp.json({
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

  if( !params.id ){
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

  if( !params.id ){
    throw new Error('illegal input');
  }

  query = { _id : params.id };

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.insert( 
          model_note.create({ 
            type : 'javascript',
            parent_id : params.id 
          }), 
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

router.post('/notebook/:id/note/:note_id/delete', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id || !params.note_id ){
    throw new Error('illegal input');
  }

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  storage.remove(query, function(err) {
      if( err ){
        next(err);
      } else {
        resp.json({ err : 0});
      }
  });
});
router.post('/notebook/:id/note/:note_id', function( req, resp, next ) {
  var query = req.query;
  var body = req.body;
  var params = req.params;

  if( !params.id || !params.note_id ){
    throw new Error('illegal input');
  }

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  var note_doc = model_note.unwrap(body);

  storage.findOne( query, function( err, doc ) {

      if( !err && doc ) {
        storage.update(query, { $set : note_doc.doc}, function( err ) {
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
  var params = req.params;

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
  var params = req.params;

  query = { 
    _id : params.note_id,
    parent_id : params.id
  };

  storage.findOne( query, function( err, note_doc ) {
    if( !err && note_doc ) {

      if( note_doc.order == 0 ){
        return do_exec();
      } 

      storage.findOne({
        parent_id : params.id,
        order : note_doc.order - 1
      }, function( err, prev_note ) {
        if( !err && prev_note ) {
          do_exec(prev_note.context);
        } else {
          next(err || new Error('prev note not found'));
        }
      });


      function do_exec( context ) {
        context = context || {};
        var code = '\nvar context = ' + JSON.stringify(context) + ';\n';
        code += decodeURIComponent(note_doc.code);
        var spliter = '::context' + Date.now() + '--'+ Math.random() + '::';
        code += '\n; console.log("\\n' + spliter +'" + JSON.stringify(context));\n';

        exec_code( code, function( err, res ) {
            if( err ){
              next(err);
            } else {
              var stdout = res.stdout;
              stdout = stdout.split('\n' + spliter);

              debug('stdout', stdout, res);

              res.stdout = stdout[0];
              var context = JSON.parse(stdout[1] || '{}');

              resp.json({
                 err : 0,
                 res : res,
                 context : context
              });

              storage.update({ _id : note_doc._id }, { $set : { context : context} }, function(err, res) {
                  debug('note context updates');
              });
            }
        });
      };

    } else {
      next();
    }
  });

});

