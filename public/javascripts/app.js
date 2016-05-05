require([
  './exec_history',
  './note',
  'ko',
  './lib/editor'
],function(
  exec_history,
  note,
  ko,
  editor
){
  
  $( document )
    .ajaxSuccess(function( e, xhr, settings, res ) {
      if( res.error != 0 ){
        console.log( res );
        e.preventDefault()
      }

    })
    .ajaxError(function( e, xhr, settings ) {
      console.log('xhr failed', arguments );
    });

  var doc_to_note = note.doc_to_note;
  
  var bootstrap_node = doc_to_note(bootstrap);
  var vm = {
    notes   : ko.observableArray(),
    bootstrap  : bootstrap_node,
    restart    : function() {
      $.post('/restart',function() {
         location.reload(); 
      });
    },
    search  : function() { },
    add_note: function() {
      $.post('/note/add',function( doc ) {
        var new_note = doc_to_note(doc);

        vm.notes().forEach(function(note) {
           note.fold(true);
        });

        vm.notes.unshift( new_note);
        new_note.fold(false);
      });
    },
    remove_note : function( note ) {
      if( confirm('你确定要删除note ： ' + note.name() + '?')){
        $.post('/note/remove',{
          id : note.id 
        },function() {
          vm.notes.remove(note);
        });
      }
    },
    exec_history : exec_history
  };
  var _nodes = notes.map(doc_to_note);

  if( _nodes[0] ){
    var node = _nodes.shift();
    vm.notes.push(node);
    node.fold(false);
  }

  ko.applyBindings(vm);

  // try to get better init performance
  
  function async_init_view(){
    if( _nodes.length ){
      var node = _nodes.shift();
      vm.notes.push(node);
      setTimeout(function() {
        async_init_view();
      },50)
    }
  }
  async_init_view();

});