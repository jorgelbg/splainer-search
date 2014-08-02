'use strict';

// Deals with normalizing documents from solr
// into a canonical representation, ie
// each doc has an id, a title, possibly a thumbnail field
// and possibly a list of sub fields
angular.module('o19s.splainer-search')
  .service('normalDocsSvc', function normalDocsSvc(explainSvc) {

    var assignSingleField = function(queryDoc, solrDoc, solrField, toProperty) {
      if (solrDoc.hasOwnProperty(solrField)) {
        queryDoc[toProperty] = solrDoc[solrField].slice(0, 200);
      }
    };

    var assignFields = function(queryDoc, solrDoc, fieldSpec) {
      assignSingleField(queryDoc, solrDoc, fieldSpec.id, 'id');
      assignSingleField(queryDoc, solrDoc, fieldSpec.title, 'title');
      assignSingleField(queryDoc, solrDoc, fieldSpec.thumb, 'thumb');
      queryDoc.subs = {};
      angular.forEach(fieldSpec.subs, function(subFieldName) {
        var hl = solrDoc.highlight(queryDoc.id, subFieldName);
        if (hl !== null) {
          queryDoc.subs[subFieldName] = hl;
        }
        else if (solrDoc.hasOwnProperty(subFieldName)) {
          queryDoc.subs[subFieldName] = solrDoc[subFieldName];
        }
      });
    };

    // A document within a query
    var NormalDoc = function(fieldSpec, doc) {
      this.solrDoc = doc;
      assignFields(this, doc, fieldSpec);
      var hasThumb = false;
      if (this.hasOwnProperty('thumb')) {
        hasThumb = true;
      }
      this.subsList = [];
      var that = this;
      angular.forEach(this.subs, function(subValue, subField) {
        if (typeof(subValue) === 'string') {
          subValue = subValue.slice(0,200);
        }
        var expanded = {field: subField, value: subValue};
        that.subsList.push(expanded);
      });

      this.hasThumb = function() {
        return hasThumb;
      };
      
      this.url = function() {
        return this.solrDoc.url(fieldSpec.id, this.id);
      };
    };

    var explainable = function(doc, explainJson) {

      var simplerExplain = explainSvc.createExplain(explainJson);
      var hotMatches = simplerExplain.vectorize();

      doc.explain = function() {
        return simplerExplain;
      };
      
      doc.hotMatches = function() {
        return hotMatches;
      };

      var hotOutOf = [];
      var lastMaxScore = -1;
      doc.hotMatchesOutOf = function(maxScore) {
        if (maxScore !== lastMaxScore) {
          hotOutOf.length = 0;
        }
        lastMaxScore = maxScore;
        if (hotOutOf.length === 0) {
          angular.forEach(hotMatches.vecObj, function(value, key) {
            var percentage = ((0.0 + value) / maxScore) * 100.0;
            hotOutOf.push({description: key, percentage: percentage});
          });
          hotOutOf.sort(function(a,b) {return b.percentage - a.percentage;});
        }
        return hotOutOf;
      };

      doc.score = simplerExplain.contribution();
      return doc;
    };

    this.createNormalDoc = function(fieldSpec, solrDoc) {
      var nDoc = new NormalDoc(fieldSpec, solrDoc);
      return this.explainDoc(nDoc, solrDoc.explain(nDoc.id));
    };

    // Decorate doc with an explain/field values/etc other
    // than what came back from Solr
    this.explainDoc = function(doc, explainJson) {
      var decorated = angular.copy(doc);
      return explainable(decorated, explainJson);
    };

    // A stub, used to display a result that we expected 
    // to find in Solr, but isn't there
    this.createPlaceholderDoc = function(docId, stubTitle) {
      return {id: docId,
              title: stubTitle};
    };

  
  });
