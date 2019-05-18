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

module.exports = {
    Barrier: Barrier
}

