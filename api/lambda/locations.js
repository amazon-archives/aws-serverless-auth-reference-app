'use strict';
let rfr = require('rfr');
let data = rfr('data');
let wrapper = rfr('wrapper');
let LocationsTable = new data.LocationsTable();


function Create(event) {

  return LocationsTable.put(JSON.parse(event.body));
}

function Delete(event){
  // If does not exists will give 404.
  return LocationsTable.get(event.pathParameters.locationId).then(
    () => {
      return LocationsTable.delete(event.pathParameters.locationId)
    });
}

function Get(event) {
  return LocationsTable.get(event.pathParameters.locationId);
}

function List(event) {
  console.log(event);
  //TODO(Justin): Add pagination to list results
  return LocationsTable.scan();
}

function Update(event) {
  let input = JSON.parse(event.body);
  return LocationsTable.get(event.pathParameters.locationId).then((data) => {
    input.createTime = data.createTime;
    input.locationId = event.pathParameters.locationId;
    return LocationsTable.put(input);
  })
}

module.exports = wrapper.wrapModule({
  Create,
  Delete,
  Get,
  List,
  Update
});
