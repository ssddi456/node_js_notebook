define([
  'ko'
],function(
  ko
){

  var histories = ko.observableArray();

  var history = function( name ) {
    this.name = name;
    this.start = Date.now();
    this.end = ko.observable(-1);
    this.running = ko.observable(true);
    this.res = ko.observable();
    var self = this;
    this.res.subscribe(function() {
      self.end(Date.now());
      self.running(false);
    });
  };

  var vm = {
    histories : histories,
    add_exec_history : function( name ) {
      var new_exec = new history(name);
      histories.unshift(new_exec);
      return new_exec;
    },
    fold : ko.observable(false)
  };

  histories.subscribe(function( node ) {
    if( node.length > 10 ){
      node = node.slice(0, 10);
      histories(node);
    }
  });

  return vm;

});