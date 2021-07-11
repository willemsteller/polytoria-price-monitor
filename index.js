const axios = require('axios');
const config = require('./config.json');
const wh = require("webhook-discord");

const interval = 2000; // ms
const limit = 100; // item per. page

if (config.webhookUrl == "...") {
    return console.warn("[WARN]: Set your Webhook URL in config.json!");
};

const Webhook = new wh.Webhook(config.webhookUrl);

let page = 0;
let priceStorage = [];
let init = true;
let storedItem; 

async function ValueChanged(Item, oldValue, newValue) {
    var rose = (oldPrice < newPrice);

    var embedColor = "#d7c500"

    let fell = rose ? "rose" : "fell";

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
    var rose = (oldPrice < newPrice);

    var embedColor = (rose == true) ? "#00ff00" : "#ff0000"
    
    let fell = (rose == true) ? "rose" : "fell";

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
    axios.get(`https://api.polytoria.com/v1/asset/limiteds?limit=${limit}&page=${page}`)
    .then(response => {
        body = response.data;

        body.forEach(Item => {
            if (Item.AssetID in priceStorage) { 
                storedItem = priceStorage[Item.AssetID];

                savedItemValue = storedItem.Value;
                gotItemValue = Item.Value;

                savedItemBestPrice = storedItem.BestPrice;
                gotItemBestPrice = Item.BestPrice;

                if (savedItemValue != gotItemValue) {
                    ValueChanged(Item, savedItemValue, gotItemValue);
                } else if (savedItemBestPrice != gotItemBestPrice) {
                    PriceChanged(Item, savedItemBestPrice, gotItemBestPrice);
                }

                priceStorage[Item.AssetID] = Item;
            } else {
                priceStorage[Item.AssetID] = Item;

                if (init) {
                    console.log("Item added to storage: " + Item.Name);
                };
            }
        });

        if (body.length == 0) {
            page = 0;

            if (init) {
                console.log("Initialization complete.");
                console.log("Monitoring market activity...");
            };

            init = false;
        } else {
            page++;
        }
    })
    .catch(err => {
        console.error(err);
    });
};

console.log("Started initialization...");

setInterval(CheckForUpdates, interval);