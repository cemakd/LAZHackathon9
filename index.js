/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
// Classes
var Room = require('./Room').Room;
var Obstacles = require('./Obstacles').Obstacles;
var Barrier = require('./Barrier').Barrier;
var Item = require('./Item').Item;
var Map = require('./Map');

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
        attributes.map = Map.initializeMap();
        attributes.visited = Map.createVisitedMap(attributes.map);
    }
    
    var speechOutput = "Welcome to Zork! ";
    var initialRoom = attributes.map[attributes.xCoordinate][attributes.yCoordinate];
    speechOutput += Room.navigationDescription(initialRoom, attributes.xCoordinate, attributes.yCoordinate, false);
    attributes.visited[attributes.xCoordinate][attributes.yCoordinate] = true;

    handlerInput.attributesManager.setSessionAttributes(attributes);

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
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
            var newRoom = map[newCoords.x][newCoords.y];
            var didVisit = attributes.visited[attributes.xCoordinate][attributes.yCoordinate];
            speechOutput += "You go " + direction + ". " + Room.navigationDescription(newRoom, attributes.xCoordinate, attributes.yCoordinate, didVisit);
            attributes.visited[attributes.xCoordinate][attributes.yCoordinate] = true;
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
      .reprompt(speechOutput)
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
            var key = Room.getItem(map[xCoord][yCoord], "key");

            if (key) {
                speechOutput += "You picked up the key";
                attributes.map[xCoord][yCoord] = Room.removeItem(attributes.map[xCoord][yCoord], "key");
                inventory.push("key");
            }
        }
  
        handlerInput.attributesManager.setSessionAttributes(attributes);
        
        return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(speechOutput)
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
        var openableObject = request.intent.slots.openableObject.value;
        if (openableObject) {
            var room = map[xCoord][yCoord];
            var obstacle = Obstacles.getObstacle(room.obstacles, openableObject);
            var item = Room.getItem(room, openableObject);
            if (obstacle) {
                if (obstacle.barrier.name == "door") {
                    var door = obstacle.barrier;
                    if (door.isPassable) {
                        speechOutput += "You already unlocked the door. ";
                    }
                    else {
                        if (request.intent.slots.object.value == "key") {
                            console.log(inventory);
                            if (inventory.includes("key")) {
                            speechOutput += "You unlocked the door. ";
                            attributes.map = unlockDoor(map, door, xCoord, yCoord, obstacle.direction);
                            }
                            else {
                                speechOutput += "You need a key to unlock the door. ";
                            }
                        }
                        else {
                            speechOutput += "You need to open the door with something. "
                        }
                    }
                }
                else {
                    speechOutput += "You can't open a " + openableObject + ". ";
                }
            }
            else if (item) {
                if (item.name === "chest") {
                    speechOutput += "Congratulations! You have completed your adventure and wake up from your daydream to find yourself back in the conference room. Thanks for playing!";
                }
                else {
                    speechOutput += "You don't know how to open a " + openableObject + ". ";
                }
            }
            else {
                speechOutput += "There is no " + openableObject +  " in here."
            }

        }
        else {
            speechOutput += "You need to specify what you wan't to open";
        }
  
        handlerInput.attributesManager.setSessionAttributes(attributes);
  
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    },
};

const SurveyHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'IntentRequest'
          && request.intent.name === 'SurveyIntent';
    },
    handle(handlerInput) {
        var request = handlerInput.requestEnvelope.request;
        var attributes = handlerInput.attributesManager.getSessionAttributes();
        var xCoord = attributes.xCoordinate;
        var yCoord = attributes.yCoordinate;
        var map = attributes.map;

        var speechOutput = Room.surveyDescription(map[xCoord][yCoord]);
  
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
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
    OpenHandler,
    SurveyHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
