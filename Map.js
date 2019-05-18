var Room = require('./Room').Room;
var Obstacles = require('./Obstacles').Obstacles;
var Barrier = require('./Barrier').Barrier;
var Item = require('./Item').Item;

// helper function for setting isPassable==false for wall barrier
function getWall() {
    var descriptions = {"locked": "A wall blocks your path"};
    return new Barrier("wall", false, descriptions);
}

// helper function for setting isPassable==true for door barrier
function getDoor() {
    var descriptions = {"open": "you opened the door",
                    "unlocked": "the door is unlocked",
                    "locked": "You can't go through a locked door!"};
    var door = new Barrier("door", false, descriptions);
    Barrier.changeStateTo(door, "locked");
    return door;
}

var initializeMap = function() {
    return [
            [new Room([], new Obstacles(getWall(), null, null, getWall())),         new Room([new Item("key")], new Obstacles(getWall(), getDoor(), getWall(), null))],
            [new Room([], new Obstacles(null, getWall(), getWall(), getWall())),    new Room([new Item("chest")], new Obstacles(getDoor(), getWall(), getWall(), getWall()))]
          ];
}

var createVisitedMap = function(map) {
    var visitedMap = [];
    map.forEach((row, rowIndex) => {
        visitedMap.push([]);
        row.forEach((column, columnIndex) => {
            visitedMap[rowIndex].push(false);
        })
    })
    return visitedMap;    
}

module.exports = {
    initializeMap: initializeMap,
    createVisitedMap: createVisitedMap
}
