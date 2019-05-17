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

    //format for what's returned: [array of object outputs] + [array of obstacle outputs]
    returnDescription = function() {
        return objects.getObjectDescriptions + obstacles.getObstacleDescriptions;
    }
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
    getObstacleDescriptions = function() {
        return [this.north.returnDescription("north"),
                this.south.returnDescription("south"),
                this.east.returnDescription("east"),
                this.west.returnDescription("west")];
    }

    getObstacle = function(obstacleName) {
        if (this.north == obstacleName)
            return this.north;
        else if (this.north == obstacleName)
            return this.north;
        else if (this.north == obstacleName)
            return this.north;
        else if (this.north == obstacleName)
            return this.north;
        return false;
    }
}

// an obstacle such as wall, door, free, etc.(??)
// door can have two states: unlocked, locked
// decription: provides description about barrier that is passed back to player

class Barrier {
    constructor(name, isPassable, passableDescription = null, surveyDescription) {
        this.name = name;
        this.isPassable = isPassable;
        this.passableDescription = passableDescription;
        this.surveyDescription = surveyDescription;
    }

    changeStateTo = function (state) {
        this.state = state;
    }

    // format for what's returned: "there is a barrier.description on your obstacles.direction"
    returnDescription = function(direction) {
      if (this.name !== "wall") {
        return this.surveyDescription +  direction + ". ";
      }
      return "";
    }
}

class Objects {
    constructor(name) {
        this.name = name;
    }

    getObjectDescriptions = function () {
        return this.name;
    }
}

// helper function for setting isPassable==false for wall barrier
function getWall() {
    return new Barrier("wall", false, "A wall blocks your path");
}

// helper function for setting isPassable==true for door barrier
function getDoor() {
    var door = new Barrier("door", true, "You can't go through a locked door.");
    door.changeStateTo("locked");
    return door;
}

function initializeMap() {
    return [
            [new Room([], new Obstacles(getWall(), null, null, getWall())), new Room(new Objects("key"), new Obstacles(getWall(), getDoor(), getWall(), null))],
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
    const speechOutput = "Welcome to Zork!";

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

    var speechOutput = "Navigation intent called. ";
    if (request.intent.slots.Direction.value === "north") {
        attributes.xCoordinate = xCoord - 1;
    }
    else if (request.intent.slots.Direction.value === "south") {
        attributes.xCoordinate = xCoord + 1;
    }
    else if (request.intent.slots.Direction.value === "east") {
        attributes.yCoordinate = yCoord + 1;
    }
    else if (request.intent.slots.Direction.value === "west") {
        attributes.yCoordinate = yCoord - 1;
    }
    handlerInput.attributesManager.setSessionAttributes(attributes);

    speechOutput += "You are at x coordinate: " + attributes.xCoordinate + " and y coordinate: " + attributes.yCoordinate;

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

        var speechOutput = "Pick up intent called. ";
        if (request.intent.slots.object.value === "key") {
            if (map[xCoord][yCoord].objects.includes("key")) {
                speechOutput += "You picked up the key";
                var itemIndex = map[xCoord][yCoord].items.indexOf("key");
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

        var speechOutput = "Open intent called. ";
        if (request.intent.slots.openableObject.value === "door") {
            var door = map[xCoord][yCoord].obstacles.getObstacle("door");
            if (door) {
                // Check if door is already unlocked
                if (door.state === "unlocked") {
                    speechOutput += "You already unlocked the door";
                }
                else {
                    speechOutput += "You unlocked the door";
                }
            }
            else {
                speechOutput += "There is no door in here."
            }
            if (map[xCoord][yCoord].objects.includes("key")) {
                speechOutput += "You picked up the key";
                var itemIndex = map[xCoord][yCoord].items.indexOf("key");
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
