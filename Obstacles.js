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
        if (obstacles.north && obstacles.north.name === obstacleName)
            return {"barrier": obstacles.north, "direction": "north"};
        else if (obstacles.south && obstacles.south.name === obstacleName)
            return {"barrier": obstacles.south, "direction": "south"};
        else if (obstacles.east && obstacles.east.name === obstacleName)
            return {"barrier": obstacles.east, "direction": "east"};
        else if (obstacles.west && obstacles.west.name === obstacleName)
            return {"barrier": obstacles.west, "direction": "west"};
        return false;
    }
}

module.exports = {
    Obstacles: Obstacles
}
