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

      $.post('/note/save',{
        timestamp : Date.now(),
        id        : self.id,
        name      : self.name(),
        code      : encodeURIComponent(self.code())
      },
      function() {
        self.saving(false);
      })
      .fail(function() {
        this.saving(false);
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

  return note;
});