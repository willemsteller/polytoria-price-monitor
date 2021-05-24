const request = require('request'); // TODO: deprecate request and use node-fetch instead. 
const config = require('./config.json')
const wh = require("webhook-discord")

let page = 0;
let priceStorage = [];
const limit = 100;
const init = true;
const interval = 1000;
let storedItem; 
let message = "";
const Webhook = new wh.Webhook(config.webhookUrl)

async function ValueChanged(Item, oldValue, newValue) {
    var embedColor = "#d7c500"
    let fell = "fell";
    if (oldValue < newValue) {
        fell = "rose";
    }
    const msg = new wh.MessageBuilder()
                .setName("Price Monitor")
                .setColor(embedColor)
                .addField("Item sold", `Value ${fell} from ${oldValue} to ${newValue}`)
                .setThumbnail("https://polytoria.com/assets/thumbnails/catalog/" + Item.AssetID + ".png")
                .addField("Best price", Item.BestPrice, true)
                .addField("Value", Item.Value, true)
                .setTitle(Item.Name)
                .setURL("https://polytoria.com/shop/" + Item.AssetID);

    await Webhook.send(msg);
}

async function PriceChanged(Item, oldPrice, newPrice) {
    var embedColor = "#ff0000"
    let fell = "fell";
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
                .addField("Value", Item.Value, true)
                .setThumbnail("https://polytoria.com/assets/thumbnails/catalog/" + Item.AssetID + ".png")
                .setTitle(Item.Name)
                .setURL("https://polytoria.com/shop/" + Item.AssetID);
    await Webhook.send(msg);
}

async function CheckForUpdates() {
    await request({
        url: `https://api.polytoria.com/v1/asset/limiteds?limit=${limit}&page=${page}`,
        method: 'GET',
        headers: {
            'Accept-Charset': 'utf-8'
        }
    }, function(err, res, body) {
        if (err) {
            return console.error("An error occured! " + err);
        }

        try {
            body = JSON.parse(body); // We need to actually dot hings correctly. Maybe use .then, it just looks better.
            // This is messy, and not explained.
            // From what i see (Carlos) I'd say that this function basically stores item data on an array to check for future updates.
            body.forEach(Item => {
                id = Item.assetID;
            
                if (Item.AssetID in priceStorage) { 
                    storedItem = priceStorage[Item.AssetID];
                    
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
        } catch (e) {
            console.warn(e);
        }

        setTimeout(CheckForUpdates, interval)
    })
}

console.log("Started initialization...");
setTimeout(CheckForUpdates, interval)


// Overall messy code, I'll try rewriting it
// - Carlos
