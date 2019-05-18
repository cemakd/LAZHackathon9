const Item  = require('./Item').Item;
const Obstacles = require('./Obstacles').Obstacles;
const RoomDescriptions = require('./RoomDescriptions');
const firstVisitRoomDescriptions = RoomDescriptions.firstVisitRoomDescriptions;
const subsequentVisitRoomDescriptions = RoomDescriptions.subsequentVisitRoomDescriptions;

class Room {
    constructor(objects, obstacles) {
        this.objects = objects;
        this.obstacles = obstacles;
    }
    
    static getItem(room, itemName) {
        var returnItem = null;
        console.log("Objects: " + room.objects);
        room.objects.forEach(item => {
            console.log("Item: " + item);
            if (item !== null && item.name === itemName)
                returnItem = item;
        });
        return returnItem;
    }
    
    static removeItem(room, itemName) {
        var itemIndex = getIndexOfObject(room.objects, "key");
        room.objects.splice(itemIndex, 1);
        return room;
    }
    
    static surveyDescription(room) {
        return Room.returnDescription(room);
    }
    
    static navigationDescription(room, x, y, visited) {
        var output = ""
        if (!visited) {
            output += firstVisitRoomDescriptions[x][y];
        }
        else {
            output += subsequentVisitRoomDescriptions[x][y];
        }
        output += Room.returnDescription(room);
        return output;
    }

    static returnDescription(room) {
        var output = "";

        var items = "";
        room.objects.forEach(element => {
            items += "a " + Item.getItemDescription(element) + ", ";
        });

        if (items) {
            output += "You see " + items.substring(0, items.length - 2) + " in the area. ";
        }
        var obstacleDescriptions = Obstacles.getObstacleSurveyDescriptions(room.obstacles);
        
        var ctr = 0;
        
        var freeSpaces = "";
        obstacleDescriptions.forEach(element => {
            var direction = "";
            if (ctr === 0)
                direction = "north";
            else if (ctr === 1)
                direction = "east";
            else if (ctr === 2)
                direction = "south";
            else
                direction = "west";

            if (!element) {
              freeSpaces += direction + ", ";
            }
            else if (element && element !== "wall") {
                output += "There is a " + element + " to the " + direction + ", ";
            }
            ctr += 1;
        });
        if (freeSpaces) {
            output += "You can go " + freeSpaces.substring(0, freeSpaces.length - 2) + ". "
        }
        
        return output;
    }
}

function getIndexOfObject(array, object) {
    array.forEach((item, index) => {
        if (item.name === object)
            return index;
    });
}

module.exports = {
    Room: Room
}

