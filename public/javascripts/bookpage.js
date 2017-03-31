require([
  './lib/model',
  './note',
  'ko',
  './lib/editor'
],function(
  model,
  note,
  ko,
  editor
){
  var noop = function() {};
  // 
  // 这将成为一个notebook的内容页
  // 新的notebook 每一个book内部是一个上下文有关的执行序列
  // 每一块均可以访问一个持久化了的 _context 对象进行数据存取
  // 每一块执行完成之后，输出执行结果( stdin & stdout )
  // 
  // 每一块的类型可以是文本或者代码，文本类型不可执行，直接展示
  // 代码类型可以执行，类型仅限js
  // 
  // 可以选择导出为html
  // 工具条统一显示在头部，对于每一个块而言不单独保存工具条。
  // 工具条的操作关联到当前块
  // 每一块可以折叠
  // 
  // 执行时，可选全部执行，或者从某一块开始执行，
  // 每一块执行完成后持久化该块对应的context，并作为下一块执行的参数
  // 
  // 其他的magic
  //    数据库连接？
  //    cookie管理？
  //
  // all
  //    exec_section
  //    
  // notebook
  //    _id
  //    name
  //    desc
  //    createAt
  //    
  //    add
  //    
  //    update 改改名字之类的
  //
  //    exec 执行所有内容
  //    executing
  //
  // note
  //    _id
  //    parent_id -> notebook._id
  //    type : javascript | typescript | text
  //    code : string,
  //    order : number 不可以为稀疏的
  //
  //    visible :
  //
  //    context :
  //
  //    add
  //    insert
  //    delete
  //    move
  //
  //    edit
  //    exec
  //    

  var model_notebookset = model({
  });

  var notebookset = function() {
      model_notebookset.prototype.create.call(this, arguments[0]);
  };
  notebookset.prototype = {
    __proto__ : model_notebookset,
    constructor : notebookset,

    add_notebook : function( done ) {
      // 这里添加notebook
      $.post('/bookpage/notebook/add', 
        function( res ) {
          done( null, res.notebook );
        });
    },
    load_books : function( done ) {
      $.get('/bookpage/notebookset', 
        function( res ) {
          done( null, 
            res.notebooks.sort(function( a, b ) {
              return b.createAt - a.createAt;
            }));
        });
    }
  };

  notebookset = new notebookset();

  var model_notebook = model({
      name : '',
      desc : '',
      createAt : {
        readonly : true,
        initial : 0,
      },
      executing : {
        readonly : true,
        initial : 0
      },
  });

  var notebook = function() {
      model_notebook.prototype.create.call(this, arguments[0]);

      this.notes = ko.observableArray([]);
  };

  var p_notebook = new model_notebook();
  notebook.prototype = p_notebook;
  p_notebook.constructor = notebook;
  p_notebook.update  = function() {
      // 更新数据
  };
  p_notebook.add_note  = function() {
      // 添加note
    var self = this;
    $.post('/bookpage/notebook/' + this.id + '/add',
      function( doc ) {
        var _note = new note(doc.note);

        _note.order = self.notes().length;
        _note.edit();

        self.notes.push(_note);
      });
  };
  p_notebook.insert  = function( node_before ) {
      // 
    node_before = this.notes.indexOf(node_before);

    var self = this;
    var notes = this.notes();
    notes.slice(node_before).forEach(function( node, idx ) {
        node.order = 1 + idx + node_before;
        node.edit();
    });

    $.post('/bookpage/notebook/' + this.id + '/add',
      function( doc ) {
        var _note = new note(doc.note);
        _note.order = node_before;
        _note.edit();
        var rest = self.notes().length - node_before;
        rest = self.notes.splice(node_before, rest);

        self.notes.push(_note);
        rest.forEach(function( node ) {
          self.notes.push(node);
        });
      });

  };
  p_notebook.move = function( node, node_before ) {
      // 
  };
  p_notebook['delete'] = function( vm, done ) {
    var self = this;
    $.post('/bookpage/notebook/'+ this.id +'/note/' + vm.id + '/delete', 
      function() {
          
        var index = self.notes.indexOf(vm);
        self.notes.remove(vm);
        console.log( index );
        self.notes.slice(index).forEach(function( node, idx ) {
            node.order = index + idx;
            node.edit();
        });
      });
    // 发送删除请求
  };
  p_notebook.initial  = function() {
      var self = this;
      this.load_notes(function( err, docs ) {

          docs
            .sort(function(a,b ) {
              console.log( a.order, b.order );
                return a.order - b.order;
            })
            .forEach(function(doc) {
                self.notes.push(new note(doc));
            });
      });
  };
  p_notebook.exec  = function(done) {
    done = done || noop;
    var self = this;
    $.post('/bookpage/notebook/'+ this.id + '/exec', 
      function( res ) {
          var reses = res.reses;
          var notes = self.notes();
          reses.forEach(function( res ) {
              notes.some(function( note ) {
                if( note.order == res.order ){
                  note.context = res.context;
                  note.res(res.res);
                  return true;
                }
              });
          });
      });    
  };
  p_notebook.save  = function() {
      
  };
  p_notebook.load_notes = function( done ) {
    $.get('/bookpage/notebook/' + this.id,function( res ) {
        done(null, res.notes);
    });
  };


  var model_note = model({
      parent_id : {
        readonly : true
      },
      type      : '',
      code      : {
        type : function( code ) {
            return ko.observable( decodeURIComponent(code) );
        },
        initial : ''
      },
      order     : 0,
      visible   : 1,
      context   : {
        readonly : true,
        initial : {}
      },
  });
  var note = function() {
      model_note.prototype.create.call(this, arguments[0]);
      var self = this;
      this.code.subscribe(function() {
          self.edit();
      });
      this.res = ko.observable();
  };
  var p_note = new model_note();
  note.prototype = p_note;
  p_note.constructor = note;
  p_note.edit = function( done ) {
    done = done || noop;
    $.post('/bookpage/notebook/'+ this.parent_id +'/note/' + this.id, 
      this.toJSON(),
      done);
  };
  p_note.exec = function( done ) {
    done = done || noop;
    var self = this;
    $.post('/bookpage/notebook/'+ this.parent_id +'/note/' + this.id + '/exec', 
      function( res ) {
        if( res.res ){
          self.res(res.res);
        }
      });
  };


  var main_vm = {
    current_notebook : ko.observable(),
    current_note : ko.observable(),
    notebooks : ko.observableArray(),

    exec_section : function( code, done ) {
        
    },

    add_notebook : function() {
        notebookset.add_notebook(function(err, notebook_doc) {
          if( notebook_doc ){
            main_vm.notebooks.unshift(new notebook(notebook_doc));
          }
        });
    },

    show_notebooks : ko.observable( false ),

    remove_notebook : function( notebook, e ) {

      e.stopPropagation();

      var self = main_vm;
      $.post('/bookpage/notebook/'+ notebook.id +'/delete',
        function() {
          self.notebooks.remove(notebook);
          if( notebook == main_vm.current_notebook() ){
            main_vm.current_notebook(undefined);
          }
        })
    },

    switch_notebook : function( notebook ) {
      var current = this.current_notebook();
      if( current ){
        current.notes([]);
      }
      this.current_notebook(notebook);  
      notebook.initial();
    },
  };

  ko.applyBindings(main_vm);

  notebookset.load_books(function( err, notebooks ) {
    if( !err ){

      notebooks.forEach(function( book ) {
          main_vm.notebooks.push( new notebook(book) );
      });

      main_vm.switch_notebook(main_vm.notebooks()[0]);
    }
  });


});