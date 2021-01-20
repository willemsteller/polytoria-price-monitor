const request = require('request');
const config = require('./config.json')
const wh = require("webhook-discord")

var page = 0;
var priceStorage = new Array();
var limit = 100;
var init = true;
let interval = 1000;

const Webhook = new wh.Webhook(config.webhookUrl)

function ValueChanged(Item, oldValue, newValue) {
    var fell = "fell";
    var embedColor = "#d7c500"
    if (oldValue < newValue) {
        fell = "rose";
    }
    var message = `Value ${fell} from ${oldValue} to ${newValue}`;
    console.log(`${Item.Name}: ${message}`);

    const msg = new wh.MessageBuilder()
                .setName("Price Monitor")
                .setColor(embedColor)
                .addField("Item sold", message)
                .setThumbnail("https://polytoria.com/assets/thumbnails/catalog/" + Item.AssetID + ".png")
                .addField("Best price", Item.BestPrice, true)
                .setTitle(Item.Name)
                .setURL("https://polytoria.com/shop/" + Item.AssetID);

    Webhook.send(msg);
}

function PriceChanged(Item, oldPrice, newPrice) {
    var fell = "fell";
    var embedColor = "#ff0000"
    if (oldPrice < newPrice) {
        fell = "rose"
        embedColor = "#00ff00"
    };
    var message = `Price ${fell} from ${oldPrice} to ${newPrice}`;
    if (newPrice <= 0) {
        message = `Price ${fell} from ${oldPrice} to off-sale`;
    }

    console.log(`${Item.Name}: ${message}`);
    const msg = new wh.MessageBuilder()
                .setName("Price Monitor")
                .setColor(embedColor)
                .addField("Price Changed", message)
                .addField("Best price", Item.BestPrice, true)
                .setThumbnail("https://polytoria.com/assets/thumbnails/catalog/" + Item.AssetID + ".png")
                .setTitle(Item.Name)
                .setURL("https://polytoria.com/shop/" + Item.AssetID);
    Webhook.send(msg);
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
                } else if (storedItem.BestPrice != Item.BestPrice) {
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