(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.Shipments = global.Shipments || {});
})(this, function (exports) {
  'use strict';

  const {Component, h} = preact;
  const {store} = Shipments;


  //
  // Main
  //

  class Main extends Component {
    render() {
      const {jobs, filter, focus: [root, jobReference, stopName]} = this.props;

      const visibleJobs = filter ? jobs.filter(job => job[filter]) : jobs;
      const job = jobs.find(job => job.reference === jobReference);
      const stop = job && job[stopName] || null;

      const left = stop ? '-200%' : job ? '-100%' : '0%';
      const transition = this.initialized ? '200ms left ease-out' : '';

      return h('main', {style: {left, transition}},
        h(JobsPane, {jobs: visibleJobs, focusedChild: job, path: [root], filter}),
        h(StopsPane, {job, focusedChild: stop, path: [root, jobReference]}),
        h(TasksPane, {job, stop, path: [root, jobReference, stopName]})
      );
    }
    componentDidMount() {
      this.initialized = true;
    }
  }

  Main.defaultProps = {jobs: []};


  //
  // Pane 1: List of Jobs
  //

  class JobsPane extends Component {
    get className() {
      const {focusedChild} = this.props;
      return focusedChild ? 'jobs-pane' : 'jobs-pane focused';
    }
    get header() {
      return 'Shipments';
    }
    get status() {
      const {jobs, filter} = this.props;
      const count = jobs.length === 0 ? 'No' : jobs.length;
      const shipments = jobs.length === 1 ? 'shipment' : 'shipments';

      if (filter) {
        return `${count} ${filter} ${shipments}`;
      } else {
        return `${count} ${shipments} in queue`;
      }
    }

    render() {
      const {jobs, focusedChild, path, filter} = this.props;
      if (jobs) {
        return (
          h('section', {className: this.className},
            h('header', null,
              h('h2', null, this.header),
              h(JobsFilter, {filter: null, focusedFilter: filter}),
              h(JobsFilter, {filter: 'active', focusedFilter: filter}),
              h(JobsFilter, {filter: 'completed', focusedFilter: filter})
            ),
            h('p', null, this.status),
            h('ul', null, jobs.map(job => h(JobItem, {job, focusedChild, path})))
          )
        );
      }
    }
  }

  class JobsFilter extends Component {
    get className() {
      const {filter, focusedFilter} = this.props;
      return filter === focusedFilter ? 'focused' : null;
    }
    get onClick() {
      const {filter} = this.props;
      return function () {
        store.patch({filter});
      }
    }
    get label() {
      const {filter} = this.props;
      return capitalize(filter || 'all');
    }

    render() {
      const {className, onClick, label} = this;
      return h('button', {className, onClick}, label);
    }
  }

  class JobItem extends Component {
    get className() {
      const {job, focusedChild} = this.props;
      return job === focusedChild ? 'job-item focused' : 'job-item';
    }

    get onClick() {
      const {job, path} = this.props;
      return function () {
        store.patch({focus: path.concat(job.reference)});
      };
    }
    get setIndeterminate() {
      const {job} = this.props;
      return function (input) {
        if (input) input.indeterminate = job.active;
      };
    }

    render() {
      const {job} = this.props;
      return (
        h('li', {className: this.className, onClick: this.onClick},
          h('label', null,
            h('input', {type: 'checkbox', checked: job.completed, disabled: true, ref: this.setIndeterminate}),
            h('h3', null, job.title),
            h('span', null, `(Reference ID: ${job.reference})`)
          )
        )
      );
    }
  }


  //
  // Pane 2: Pickup & Dropoff Stops
  //

  class StopsPane extends Component {
    get className() {
      const {focusedChild} = this.props;
      return focusedChild ? 'stops-pane' : 'stops-pane focused';
    }
    get header() {
      return this.props.job.title;
    }

    get navigateUp() {
      const {path} = this.props;
      return function () {
        store.patch({focus: path.slice(0, -1)});
      };
    }

    render() {
      const {job, focusedChild, path} = this.props;
      if (job) {
        return (
          h('section', {className: this.className},
            h('header', {className: 'navigate-up', onClick: this.navigateUp},
              h('h2', null, this.header)
            ),
            h('ul', null,
              h(StopItem, {job, name: 'pickup', stop: job.pickup, path}),
              h(StopItem, {job, name: 'dropoff', stop: job.dropoff, path})
            )
          )
        );
      }
    }
  }

  class StopItem extends Component {
    get className() {
      const {stop, focusedChild} = this.props;
      return stop === focusedChild ? 'stop-item focused' : 'stop-item';
    }

    get onClick() {
      const {name, path} = this.props;
      return function () {
        store.patch({focus: path.concat(name)});
      };
    }
    get setIndeterminate() {
      const {stop} = this.props;
      return function (input) {
        if (input) input.indeterminate = stop.active;
      };
    }

    render() {
      const {name, stop} = this.props;
      return (
        h('li', {className: this.className, onClick: this.onClick},
          h('label', null,
            h('input', {type: 'checkbox', checked: stop.completed, disabled: true, ref: this.setIndeterminate}),
            h('h3', null, capitalize(name)),
            h(Address, {address: stop.address}),
            h(Time, {time: stop.time})
          )
        )
      );
    }
  }

  class Address extends Component {
    render() {
      const {address} = this.props;
      return h('address', null, address);
    }
  }

  class Time extends Component {
    render() {
      const {time} = this.props;
      return h('time', {datetime: time.toISOString()}, time.toLocaleString());
    }
  }



  //
  // Pane 3: Inventory and Lading Tasks
  //

  class TasksPane extends Component {
    get className() {
      return this.disabled ? 'tasks-pane focused disabled' : 'tasks-pane focused'; 
    }
    get disabled() {
      const {job, path: [root, jobReference, stopName]} = this.props;

      switch (stopName) {
        case 'pickup':
          return job.dropoff.inventory.completed || job.dropoff.lading.completed;
        case 'dropoff':
          return !job.pickup.completed;
        default:
          return true;
      }
    }
    get header() {
      const {path: [root, jobReference, stopName]} = this.props;
      return capitalize(stopName);
    }

    get navigateUp() {
      const {path} = this.props;
      return function () {
        store.patch({focus: path.slice(0, -1)});
      };
    }

    render() {
      const {stop, path} = this.props;
      if (stop) {
        const disabled = this.disabled;
        return (
          h('section', {className: this.className},
            h('header', {className: 'navigate-up', onClick: this.navigateUp},
              h('h2', null, this.header)
            ),
            h('ul', null,
              h(TaskItem, {stop, name: 'inventory', task: stop.inventory, disabled, path}),
              h(TaskItem, {stop, name: 'lading', task: stop.lading, disabled, path})
            )
          )
        );
      }
    }
  }

  class TaskItem extends Component {
    get label() {
      const {name, path: [root, jobReference, stopName]} = this.props;

      switch (name) {
        case 'inventory':
          return `Photograph inventory at ${stopName}`;
        case 'lading':
          const ladingAction = stopName === 'dropoff' ? 'signed' : 'received';
          return `Bill of lading (B/L) ${ladingAction}`;
        default:
          return '';
      }
    }

    get onChange() {
      const {task} = this.props;
      return function (event) {
        task.complete(event.target.checked);
        store.patch();
      };
    }

    render() {
      const {task, disabled} = this.props;
      return (
        h('li', null,
          h('label', null,
            h('input', {type: 'checkbox', checked: task.completed, disabled, onChange: this.onChange}),
            this.label
          )
        )
      );
    }
  }


  //
  // Utilities
  //

  function capitalize(string) {
    return string.slice(0, 1).toLocaleUpperCase() + string.slice(1);
  }


  //
  // Exports
  //

  exports.views = {Main};

});
