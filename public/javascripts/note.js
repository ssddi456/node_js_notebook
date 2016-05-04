define([
  '_',
  'ko'
],function(
  __,
  ko
){
  function note ( id ) {

    this.id   = id;

    this.name = ko.observable('');
    this.code = ko.observable('here is some code');

    this.res = ko.observable();
    this.saving = ko.observable(false);

    this.visible = ko.observable(true);
    this.fold = ko.observable(true);
    this.res_fold = ko.observable(false);


    this.is_bootstrap = false;

    this.index = ko.observable(0);

    var self = this;
    this.toggle_res_fold = function() {
      self.res_fold( !self.res_fold() );
    }
  }

  var fn = note.prototype;

  fn.init = function() {
    var self = this;

    var _sync = _.throttle(function() {
      if( self.saving() ){
        setTimeout(function() {
          _sync();
        },500);
        return;
      }

      self.saving(true);
      var save_url = '/note/save';
      if( self.is_bootstrap ){
        save_url = '/note/save_bootstrap';
      }

      $.post(save_url,{
        timestamp : Date.now(),
        id        : self.id,
        name      : self.name(),
        code      : encodeURIComponent(self.code())
      },
      function() {
        self.saving(false);
      })
      .fail(function() {
        self.saving(false);
      });
    },500);

    this.name.subscribe(_sync);
    this.code.subscribe(_sync);
  }

  fn.exec = function(){
    if( this.saving() ){
      return;
    }
    var self = this;
    $.post('/note/exec',{
      id : self.id
    },function(res) {
      self.res(res.res);
    })
  };


  note.doc_to_note = function ( doc  ) {
    var new_note = new note(doc._id);


    new_note.name(doc.name);
    new_note.code( decodeURIComponent(doc.code));
    new_note.res(doc.res);
    
    new_note.is_bootstrap = doc.is_bootstrap;
    new_note.index(doc.index);

    new_note.init();

    return new_note;
  }

  return note;
});