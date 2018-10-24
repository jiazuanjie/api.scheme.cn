'use strict';

let SearchEngine = require('../../lib/elasticsearch');
let assert = require('assert');
let sinon = require('sinon');

describe('SearchEngine', function() {
  //elasticsearch client stub
  let client = {
    bulk: sinon.stub(),
    count: sinon.stub(),
    delete: sinon.stub(),
    update: sinon.stub(),
    search: sinon.stub()
  };

  describe('#constructor', function() {
    it('sets defaults', ()=>{
      let config = {
        host: "localhost:1231",
        client: 'client'
      };
      let searchEngine = new SearchEngine(config);
      assert.equal(searchEngine.ENDPOINT_SQL, `http://${config.host}/_sql`);
      assert.equal(searchEngine.client, config.client);
    });
  });

  describe('.setIndex', function() {
    it('sets index', ()=>{
      let searchEngine = new SearchEngine({});
      searchEngine.setIndex('school');
      assert.equal(searchEngine.index, 'school');
    });
  });

  describe('.setType', function() {
    it('sets type', ()=>{
      let searchEngine = new SearchEngine({});
      searchEngine.setType('file');
      assert.equal(searchEngine.type, 'file');
    });
  });

  describe('.bulk', function() {
    it('invokes client.bulk', ()=>{
      let searchEngine = new SearchEngine({client});
      let data = [{}];
      searchEngine.bulk(data);
      sinon.assert.calledWith(client.bulk, {body: data});
    });
  });

  describe('.count', function() {
    let searchEngine, filter;
    beforeEach(()=>{
      searchEngine = new SearchEngine({client});
      filter = {com_id: 1};
      searchEngine.count(filter);
    });

    it('invokes client.count once', ()=>{
      sinon.assert.calledOnce(client.count);
    });

    it('invokes client.count', ()=>{
      searchEngine.count(filter);
      sinon.assert.calledWith(client.count, {
        index: searchEngine.index,
        type: searchEngine.type,
        body: filter,
        ignore: [404]
      });
    });
  });

  describe('.delete', function(){
    it('invokes client.delete', ()=>{
      let searchEngine = new SearchEngine({client});
      searchEngine.delete(3);
      sinon.assert.calledOnce(client.delete);
      sinon.assert.calledWith(client.delete, {
        index: searchEngine.index,
        type: searchEngine.type,
        id: 3,
        ignore: [404]
      });
    });
  });

  describe('.createOrUpdate', function() {
    it('invokes client.update ', ()=>{
      let searchEngine = new SearchEngine({client});
      let data = {
        _id: 1,
        id: 1,
        name: 'neil'
      };
      searchEngine.createOrUpdate(data);
      sinon.assert.calledOnce(client.update);
      sinon.assert.calledWith(client.update, {
        index: searchEngine.index,
        type: searchEngine.type,
        id: data.id,
        body: {
          doc: data,
          doc_as_upsert: true
        }
      });
    });
  });

  describe('.search', function() {
    beforeEach(()=>{
      this.searchEngine = new SearchEngine({client});
      let response = {
        hits: {
          total: 0,
          hits: []
        }
      }
      client.search = sinon.stub().returns(Promise.resolve(response));
    });

    it('supports q and invokes client.search', ()=>{
      let filter = { q: 'name: "neil"' };
      this.searchEngine.search(filter);
      sinon.assert.calledOnce(client.search);
      sinon.assert.calledWith(client.search, {
        index: this.searchEngine.index,
        type: this.searchEngine.type,
        analyzeWildcard:true,
        q: filter.q,
        from: filter.form,
        size: filter.size,
        ignore:[404]
      });
    });

    it('sets options', ()=>{
    });

    it('supports body and invokes client.search', ()=>{
      let filter = {
        body: {
          query: {
            match: {name: 'neil'}
          }
        }
      };
      this.searchEngine.search(filter);
      sinon.assert.calledOnce(client.search);
      sinon.assert.calledWith(client.search, {
        index: this.searchEngine.index,
        type: this.searchEngine.type,
        analyzeWildcard:true,
        body: filter.body,
        from: filter.form,
        size: filter.size,
        ignore:[404]
      });
    });

    it('returns response in the following format', (done) => {
      let filter = {
        q: 'name: "neil"' ,
        from: 1,
        size: 2
      };
      this.searchEngine.search(filter).then(result=>{
        console.log(result);
        assert.ok(result.hasOwnProperty('items'));
        assert.ok(Array.isArray(result.items));
        assert.ok(result.counts.hasOwnProperty('page'));
        assert.ok(result.counts.hasOwnProperty('per_page'));
        assert.ok(result.counts.hasOwnProperty('total_items'));
        assert.ok(result.counts.hasOwnProperty('total_pages'));
        done();
      }).catch(done);
    });
  });

});
