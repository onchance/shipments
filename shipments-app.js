(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.Shipments = global.Shipments || {});
})(this, function (exports) {
  'use strict';

  const {h, render} = preact;

  const {models, store, views} = Shipments;
  const {ViewState} = models;
  const {Main} = views;

  exports.render = main => {
    store.onChange(state => {
      render(h(Main, state.toJSON()), null, main);
    });
  };

});
