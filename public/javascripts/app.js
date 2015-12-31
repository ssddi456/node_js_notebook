require([
  './note',
  'ko',
  './lib/editor'
],function(
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

  function doc_to_note( doc  ) {
    var new_note = new note(doc.id);
    new_note.name(doc.name);
    new_note.code( decodeURIComponent(doc.code));
    new_note.res(doc.res);

    new_note.init();

    return new_note;
  }

  var vm = {
    notes   : ko.observableArray( notes.map(doc_to_note) ),
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
    }
  };

  vm.notes()[0].fold(false);

  ko.applyBindings(vm);
});