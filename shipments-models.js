(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.Shipments = global.Shipments || {});
})(this, function (exports) {
  'use strict';

  //
  // Shipments Data
  //

  class Job {
    constructor(object) {
      const {title, reference, pickup, dropoff} = object || {};
      Object.defineProperty(this, '__private__', {value: {}});
      Object.assign(this, {title, reference, pickup, dropoff});
    }

    get description() {
      return this.pickup.description;
    }
    set description(string) {
      this.pickup.description = string;
    }

    get pickup() {
      return this.__private__.pickup;
    }
    set pickup(object) {
      this.__private__.pickup = new Stop(object);
    }

    get dropoff() {
      return this.__private__.dropoff;
    }
    set dropoff(object) {
      this.__private__.dropoff = new Stop(object);
    }

    toJSON() {
      const {title, reference, pickup, dropoff} = this;
      return {title, reference, pickup, dropoff};
    }
  }

  class Stop {
    constructor(object) {
      const {address, description, time} = object || {};
      Object.defineProperty(this, '__private__', {value: {}});
      Object.assign(this, {address, description, time});
    }

    get time() {
      return this.__private__.time;
    }
    set time(string) {
      this.__private__.time = string ? new Date(string) : null;
    }

    toJSON() {
      const {address, description, time} = this;
      return {address, description, time};
    }
  }


  //
  // Shipments State
  //

  class JobList extends Array {
    constructor(...array) {
      super(...array);
      this.coerce();
    }

    coerce() {
      for (let i = 0; i < this.length; ++i) {
        if (this[i] instanceof JobState) continue;
        this[i] = new JobState(this[i]);
      }
    }
  }

  class JobState extends Job {
    constructor(object) {
      super(object);
    }

    get pickup() {
      return this.__private__.pickup;
    }
    set pickup(object) {
      this.__private__.pickup = new StopState(object);
    }

    get dropoff() {
      return this.__private__.dropoff;
    }
    set dropoff(object) {
      this.__private__.dropoff = new StopState(object);
    }

    get active() {
      return Boolean(
        (this.pickup.active || this.dropoff.active) ||
        (this.pickup.completed ^ this.dropoff.completed)
      );
    }

    get completed() {
      return this.pickup.completed && this.dropoff.completed;
    }

    toJSON() {
      const {pickup, dropoff} = this;
      return Object.assign(super.toJSON(), {pickup, dropoff});
    }
  }

  class StopState extends Stop {
    constructor(object) {
      super(object);
      const {inventory, lading} = object || {};
      Object.assign(this, {inventory, lading});
    }

    get inventory() {
      return this.__private__.inventory;
    }
    set inventory(object) {
      this.__private__.inventory = new TaskState(object);
    }

    get lading() {
      return this.__private__.lading;
    }
    set lading(object) {
      this.__private__.lading = new TaskState(object);
    }

    get active() {
      return Boolean(this.inventory.completed ^ this.lading.completed);
    }

    get completed() {
     return this.inventory.completed && this.lading.completed;
    }

    toJSON() {
      const {inventory, lading} = this;
      return Object.assign(super.toJSON(), {inventory, lading});
    }
  }

  class TaskState {
    constructor(object) {
      const {time, position, photo} = object || {};
      Object.defineProperty(this, '__private__', {value: {}});
      Object.assign(this, {time, position, photo});
    }

    get time() {
      return this.__private__.time;
    }
    set time(string) {
      this.__private__.time = string ? new Date(string) : null;
    }

    get photo() {
      return this.__private__.photo;
    }
    set photo(object) {
      this.__private__.photo = object ? new Upload(object) : null;
    }

    get completed() {
      return this.time !== null;
    }

    toJSON() {
      const {time, position, photo} = this;
      return {time, position, photo};
    }

    complete(completed) {
      if (completed) {
        this.time = Date.now();
      } else {
        this.time = null;
      }
    }
  }

  class Upload {
    constructor(string) {
      const {uri} = object || {};
      Object.assign(this, {uri});
    }
  }


  //
  // View State
  //

  class ViewState {
    constructor(object) {
      const {jobs, filter, focus, position} = object || {};
      Object.defineProperty(this, '__private__', {value: {}});
      Object.assign(this, {jobs, filter, focus, position});
    }

    get jobs() {
      return this.__private__.jobs;
    }
    set jobs(array) {
      this.__private__.jobs = new JobList(...array || []);
    }

    get filter() {
      return this.__private__.filter || ViewState.Filter.ALL;
    }
    set filter(string) {
      switch (string) {
        case ViewState.Filter.ACTIVE:
        case ViewState.Filter.COMPLETED:
          this.__private__.filter = string;
          break;
        default:
          this.__private__.filter = ViewState.Filter.ALL;
      }
    }

    get focus() {
      return this.__private__.focus || ['jobs'];
    }
    set focus(array) {
      if (array && array[0] == 'jobs') {
        this.__private__.focus = array;
      } else {
        this.__private__.focus = ['jobs'];
      }
    }

    toJSON() {
      const {jobs, filter, focus, position} = this;
      return {jobs, filter, focus, position};
    }
  }

  ViewState.Filter = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ALL: null,
  };


  //
  // Exports
  //

  exports.models = {
    Job,
    JobList,
    JobState,
    Stop,
    StopState,
    TaskState,
    Upload,
    ViewState,
  };

});
