class Item {
    constructor(name) {
        this.name = name;
    }

    static getItemDescription(item) {
        return item.name;
    }
}

module.exports = {
    Item: Item
}


