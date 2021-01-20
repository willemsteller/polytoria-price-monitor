const request = require('request');

var page = 0;
var priceStorage = new Array();
var limit = 100;
var init = true;
let interval = 1000;

function ValueChanged(Item, oldValue, newValue) {
    var fell = "fell";
    if (oldValue < newValue) fell = "rose";
    console.log(`${Item.Name}: Sold, value ${fell} from ${oldValue} to ${newValue}`);

    /* You can add other stuff here such as a Discord webhook */
}

function PriceChanged(Item, oldPrice, newPrice) {
    var fell = "fell";
    if (oldPrice < newPrice) fell = "rose";
    if (newPrice > 0) {
        console.log(`${Item.Name}: Price ${fell} from ${oldPrice} to ${newPrice}`);
    } else {
        console.log(`${Item.Name}: Price ${fell} from ${oldPrice} to off-sale`);
    }
    
    /* You can add other stuff here such as a Discord webhook */
}

function CheckForUpdates() {
    request({
        url: `https://api.polytoria.com/asset/limiteds?limit=${limit}&page=${page}`,
        method: 'GET',
        headers: {
            'Accept-Charset': 'utf-8'
        }
    }, function(err, res, body) {
        if (err) {
            return console.error("An error occured! " + err);
        }

        body = JSON.parse(body);

        body.forEach(Item => {
            if (Item.AssetID in priceStorage) {
                var storedItem = priceStorage[Item.AssetID];
                
                if (storedItem.Value != Item.Value) {
                    ValueChanged(Item, storedItem.Value, Item.Value);
                }

                if (storedItem.BestPrice != Item.BestPrice) {
                    PriceChanged(Item, storedItem.BestPrice, Item.BestPrice);
                }

                priceStorage[Item.AssetID] = Item;
            } else {
                priceStorage[Item.AssetID] = Item;
                if (!init)
                    console.log("Item added to storage: " + Item.Name);
            }
        });

        if (body.length == 0) {
            page = 0;
            if (init) {
                console.log("Initialization complete.");
                console.log("Monitoring market activity...");
            }
                

            init = false;
        } else {
            page++;
        }
        
        setTimeout(CheckForUpdates, interval)
    })
}

console.log("Started initialization...");
setTimeout(CheckForUpdates, interval)