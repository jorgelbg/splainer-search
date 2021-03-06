'use strict';

/*
 * Basic vector operations used by explain svc
 *
 * */
angular.module('o19s.splainer-search')
  .service('vectorSvc', [
    function vectorSvc() {

      var SparseVector = function() {
        this.vecObj = {};

        var asStr = '';
        var setDirty = function() {
          asStr = '';
        };

        this.set = function(key, value) {
          this.vecObj[key] = value;
          setDirty();
        };

        this.get = function(key) {
          if (this.vecObj.hasOwnProperty(key)) {
            return this.vecObj[key];
          }
          return undefined;
        };

        this.add = function(key, value) {
          if (this.vecObj.hasOwnProperty(key)) {
            this.vecObj[key] += value;
          }
          else {
            this.vecObj[key] = value;
          }
          setDirty();
        };

        this.toStr = function() {
          // memoize the toStr conversion
          if (asStr === '') {
            // sort
            var sortedL = [];
            angular.forEach(this.vecObj, function(value, key) {
              sortedL.push([key, value]);
            });
            sortedL.sort(function(lhs, rhs) {return rhs[1] - lhs[1];});
            angular.forEach(sortedL, function(keyVal) {
              asStr += (keyVal[1] + ' ' + keyVal[0] + '\n');
            });
          }
          return asStr;
        };

      };

      this.create = function() {
        return new SparseVector();
      };

      this.add = function(lhs, rhs) {
        var rVal = this.create();
        angular.forEach(lhs.vecObj, function(value, key) {
          rVal.set(key, value);
        });
        angular.forEach(rhs.vecObj, function(value, key) {
          rVal.set(key, value);
        });
        return rVal;
      };

      this.sumOf = function(lhs, rhs) {
        var rVal = this.create();
        angular.forEach(lhs.vecObj, function(value, key) {
          rVal.add(key, value);
        });
        angular.forEach(rhs.vecObj, function(value, key) {
          rVal.add(key, value);
        });
        return rVal;
      };


      this.scale = function(lhs, scalar) {
        var rVal = this.create();
        angular.forEach(lhs.vecObj, function(value, key) {
          rVal.set(key, value * scalar);
        });
        return rVal;
      };
    }
  ]);
