/* eslint-disable  func-names */
/* eslint-disable  no-console */
/*
To join the video meeting, click this link: https://meet.google.com/ids-cxta-dtb
Otherwise, to join by phone, dial +1 347-378-7766 and enter this PIN: 907 047 015#
*/

const Alexa = require('ask-sdk');


class Room {
    constructor(objects, obstacles) {
        this.objects = objects;
        this.obstacles = obstacles;
    }

    static returnDescription(room) {
        var output = "";

        var str = "";
        room.objects.forEach(element => {
            str += "a " + Item.getItemDescription(element) + ", ";
        });

        if (str) {
            output += "You see " + str + " in the area. ";
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
          output += "You can go " + freeSpaces
        }
        
        return output;
    }

    //format for what's returned: [array of object outputs] + [array of obstacle outputs]
    
}

//represents all the four sides of a room
class Obstacles {
    constructor(north, south, east, west) {
        this.north = north;
        this.south = south;
        this.east = east;
        this.west = west;
    }

    //returns an array of barrier descriptions
    static getObstacleSurveyDescriptions(obstacles) {
        return [obstacles.north ? obstacles.north.name: "",
                obstacles.east ? obstacles.east.name : "",
                obstacles.south ? obstacles.south.name : "",
                obstacles.west ? obstacles.west.name : ""];
    }

    static getObstacle(obstacles, obstacleName) {
        if (obstacles.north.name === obstacleName)
            return {"barrier": obstacles.north, "direction": "north"};
        else if (obstacles.south.name === obstacleName)
            return {"barrier": obstacles.south, "direction": "south"};
        else if (obstacles.east.name === obstacleName)
            return {"barrier": obstacles.east, "direction": "east"};
        else if (obstacles.west.name === obstacleName)
            return {"barrier": obstacles.west, "direction": "west"};
        return false;
    }
}

// an obstacle such as wall, door, free, etc.(??)
// door can have two states: unlocked, locked
// decription: provides description about barrier that is passed back to player

class Barrier {
    constructor(name, isPassable, descriptions) {
        this.name = name;
        this.isPassable = isPassable;
        this.descriptions = descriptions;
    }

    static changeStateTo(barrier, state) {
        barrier.state = state;
    }

    // format for what's returned: "barrier.description based on the intent"
    static returnDescription(barrier, intent) {
      if (intent in barrier.descriptions) {
        return barrier.descriptions[intent];
      }
      return "";
    }
}

class Item {
    constructor(name) {
        this.name = name;
    }

    static getItemDescription(item) {
        return item.name;
    }
}

function getIndexOfObject(array, object) {
    array.forEach((item, index) => {
        if (item.name === object)
            return index;
    });
}

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

function initializeMap() {
    return [
            [new Room([], new Obstacles(getWall(), null, null, getWall())), new Room([new Item("key")], new Obstacles(getWall(), getDoor(), getWall(), null))],
            [new Room([], new Obstacles(null, getWall(), getWall(), getWall())), new Room([], new Obstacles(getDoor(), getWall(), getWall(), getWall()))]
          ];
}

function isItem(map, item, xCoord, yCoord) {
    if (map[xCoord][yCoord].items.includes(item)) {
        var itemIndex = map[xCoord][yCoord].items.indexOf(item);
        map[xCoord][yCoord].items.splice(itemIndex, 1);
        return true;
    }
    return null;
}

function getCoordinateInThisDirection(currentX, currentY, direction) {
    if (direction === "north") {
        return {"x": currentX - 1, "y": currentY};
    }
    else if (direction === "south") {
        return {"x": currentX + 1, "y": currentY};
    }
    else if (direction === "east") {
        return {"x": currentX, "y": currentY + 1};
    }
    else if (direction === "west") {
        return {"x": currentX, "y": currentY - 1};
    }
    return {"x": 0, "y": 0};
}

function getOppositeDirection(direction) {
    if (direction === "north")
        return "south";
    if (direction === "south")
        return "north";
    if (direction === "east")
        return "west";
    if (direction === "west")
        return "east";
}

function unlockDoor(map, door, currentX, currentY, direction) {
    // Unlock door in current room
    var otherDoorCoords = getCoordinateInThisDirection(currentX, currentY, direction);
    console.log(direction);
    if (direction === "north") {
        map[otherDoorCoords.x][otherDoorCoords.y].obstacles.south.isPassable = true;
        map[currentX][currentY].obstacles.north.isPassable = true;
    }
    else if (direction === "south") {
        map[otherDoorCoords.x][otherDoorCoords.y].obstacles.north.isPassable = true;
        map[currentX][currentY].obstacles.south.isPassable = true;
    } 
    else if (direction === "east") {
        map[otherDoorCoords.x][otherDoorCoords.y].obstacles.west.isPassable = true;
        map[currentX][currentY].obstacles.east.isPassable = true;
    }
    else if (direction === "west") {
        map[otherDoorCoords.x][otherDoorCoords.y].obstacles.east.isPassable = true;
        map[currentX][currentY].obstacles.west.isPassable = true;
    }
    return map;
}

const LaunchHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    if (attributes.xCoordinate === undefined) {
        attributes.xCoordinate = 1;
        attributes.yCoordinate = 0;
        attributes.inventory = [];
        attributes.map = initializeMap();
    }
    
    handlerInput.attributesManager.setSessionAttributes(attributes);
    var speechOutput = "Welcome to Zork!";
    speechOutput += Room.returnDescription(attributes.map[attributes.xCoordinate][attributes.yCoordinate]);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(REPROMPT_MESSAGE)
      .getResponse();
  },
};

const NavigationHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
        && request.intent.name === 'NavigationIntent';
  },
  handle(handlerInput) {
    var request = handlerInput.requestEnvelope.request;
    var attributes = handlerInput.attributesManager.getSessionAttributes();
    var xCoord = attributes.xCoordinate;
    var yCoord = attributes.yCoordinate;
    var map = attributes.map;

    var speechOutput = "";
    var direction = request.intent.slots.Direction.value;
    if (direction) {
        var obstacles = map[xCoord][yCoord].obstacles;
        var barrier;
        if (direction === "north") {
            barrier = obstacles.north;
        }
        else if (direction === "south") {
            barrier = obstacles.south;
        }
        else if (direction === "east") {
            barrier = obstacles.east;
        }
        else if (direction === "west") {
            barrier = obstacles.west;
        }

        if (barrier === null || barrier.isPassable) {
            var newCoords = getCoordinateInThisDirection(xCoord, yCoord, direction);
            attributes.xCoordinate = newCoords.x;
            attributes.yCoordinate = newCoords.y;
            speechOutput += "You go " + direction + Room.returnDescription(map[newCoords.x][newCoords.y]);
        }
        else {
            speechOutput += Barrier.returnDescription(barrier, "locked");
        }
        
    }
    else {
        speechOutput += "Which direction do you want to go?";
    }
    handlerInput.attributesManager.setSessionAttributes(attributes);

    

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(REPROMPT_MESSAGE)
      .getResponse();
  },
};

const PickUpHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest'
          && request.intent.name === 'PickUpIntent';
    },
    handle(handlerInput) {
        var request = handlerInput.requestEnvelope.request;
        var attributes = handlerInput.attributesManager.getSessionAttributes();
        var xCoord = attributes.xCoordinate;
        var yCoord = attributes.yCoordinate;
        var map = attributes.map;
        var inventory = attributes.inventory;

        var speechOutput = "";
        if (request.intent.slots.object.value === "key") {
            var objectsInRoom = map[xCoord][yCoord].objects;
            var roomContainsKey = false;
            objectsInRoom.forEach(item => {
                if (item.name == "key")
                    roomContainsKey = true;
            });

            if (roomContainsKey) {
                speechOutput += "You picked up the key";
                var itemIndex = getIndexOfObject(map[xCoord][yCoord].objects, "key");
                map[xCoord][yCoord].objects.splice(itemIndex, 1);
                inventory.push("key");
            }
        }
  
      handlerInput.attributesManager.setSessionAttributes(attributes);
  
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(REPROMPT_MESSAGE)
        .getResponse();
    },
  };

  
const OpenHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest'
          && request.intent.name === 'OpenIntent';
    },
    handle(handlerInput) {
        var request = handlerInput.requestEnvelope.request;
        var attributes = handlerInput.attributesManager.getSessionAttributes();
        var xCoord = attributes.xCoordinate;
        var yCoord = attributes.yCoordinate;
        var map = attributes.map;
        var inventory = attributes.inventory;

        var speechOutput = "";
        if (request.intent.slots.openableObject.value === "door") {
            var doorObject = Obstacles.getObstacle(map[xCoord][yCoord].obstacles, "door");
            if (doorObject) {
                // Check if door is already unlocked
                var door = doorObject.barrier;
                if (door.isPassable) {
                    speechOutput += "You already unlocked the door";
                }
                else {
                    speechOutput += "You unlocked the door";
                    attributes.map = unlockDoor(map, door, xCoord, yCoord, doorObject.direction);
                }
            }
            else {
                speechOutput += "There is no door in here."
            }
        }
  
        handlerInput.attributesManager.setSessionAttributes(attributes);
  
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(REPROMPT_MESSAGE)
            .getResponse();
    },
  };

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Zork';
const REPROMPT_MESSAGE = 'What would you like to do?'
const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchHandler,
    NavigationHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler,
    PickUpHandler,
    OpenHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
