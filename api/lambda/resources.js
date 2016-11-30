'use strict';
let rfr = require('rfr');
let data = rfr('data');
let wrapper = rfr('wrapper');
let ResourcesTable = new data.ResourcesTable();


function Create(event) {
  let input = JSON.parse(event.body);
  return ResourcesTable.put(input);
}

function Delete(event){
  // If does not exists will give 404.
  return ResourcesTable.get(event.pathParameters.resourceId).then(
    () => {
      return ResourcesTable.delete(event.pathParameters.resourceId)
    });
}

function Get(event) {
  return ResourcesTable.get(event.pathParameters.resourceId);
}

function List(event) {
  console.log(event);
  return ResourcesTable.queryResourcesByLocationId(event.pathParameters.locationId);
}

function Update(event) {
  let input = JSON.parse(event.body);
  return ResourcesTable.get(event.pathParameters.resourceId).then((data) => {
    input.createTime = data.createTime;
    input.resourceId = event.pathParameters.resourceId;
    return ResourcesTable.put(input);
  })
}

module.exports = wrapper.wrapModule({
  Create,
  Delete,
  Get,
  List,
  Update
});
