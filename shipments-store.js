(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.Shipments = global.Shipments || {});
})(this, function (exports) {
  'use strict';

  const {ViewState} = Shipments.models;


  //
  // Data Store
  //

  class Store {
    constructor() {
      // id, revision, view state
      this.id = 'state';
      this.rev = null;
      this.state = null;
      // initialize database with change detection
      this.callbacks = [];
      this.db = new PouchDB('shipments');
      this.db.changes({since: 'now', live: true, include_docs: true})
        .on('change', change => this.triggerChange(change.doc));
    }

    // Change Listeners

    onChange(callback) {
      this.offChange(callback);
      this.callbacks.push(callback);
      if (this.state) callback(this.state);
    }

    offChange(callback) {
      const index = this.callbacks.indexOf(callback);
      this.callbacks.splice(index, 1);
    }

    triggerChange(state) {
      this.rev = state._rev || this.rev;
      this.state = new ViewState(state);
      this.callbacks.forEach(callback => callback(this.state));
      return this.state;
    }

    // Database Operations

    put(object) {
      object = serialize(object || {});
      object = Object.assign(object, {_id: this.id, _rev: this.rev});
      return this.db.put(object);
    }

    patch(object) {
      this.state = this.state || {};
      this.state = Object.assign(this.state, object);
      return this.put(this.state);
    }

    // Load Data from URI

    load(uri) {
      this.db.get(this.id)
        .then(state => {
          this.triggerChange(state);
        })
        .catch(() => {
          const xhr = new XMLHttpRequest;
          xhr.open('GET', uri, true);
          xhr.onload = () => this.patch(JSON.parse(xhr.responseText))
          xhr.send();
        });
    }
  }


  //
  // Utilities
  //

  function serialize(object) {
    switch (typeof object) {
      case 'boolean':
      case 'number':
      case 'string':
      case 'undefined':
        return object;
      default:
        if (object === null) {
          return object;
        } else if (typeof object.toJSON === 'function') {
          return serialize(object.toJSON());
        } else if (object instanceof Array) {
          return object.map(serialize);
        } else if (object instanceof Date) {
          return object.toISOString();
        } else {
          const serialized = {};
          for (let name in object) {
            if (!object.hasOwnProperty(name)) continue;
            if (object[name] === undefined) continue;
            serialized[name] = serialize(object[name]);
          }
          return serialized;
        }
    }
  }


  //
  // Exports
  //

  exports.store = new Store;

});
