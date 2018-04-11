const express = require('express');
const axios = require('axios')
const request = require('request-promise');
const cfenv = require('cfenv');
const bodyParser = require('body-parser');
const exphbs = require("express-handlebars");
const AccuWeather = require('accuweather');
const infos = require("./scripts/api");
const regions = infos.regions;
const locations = infos.locations;
const keys = infos.keys;

// set up middleware
const app = express();
//var ninetyDaysInMilliseconds = 7776000000;
app.use(bodyParser.json());
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");
app.use(express.static(__dirname + '/public'));

//get temperature from ibm api or accuWeather
function get_temp(options) {
  return request(options)
          .then(function(data) {
            return JSON.parse(data);
            //return JSON.parse(data)["forecasts"][0].temp;
          });
}
//get temperature from national weather service
let get_nws = async function(url) {
  let data = await axios.get(url).then(response => {
    return response.data.properties.periods[0]['temperature'];
  });
  return data;
}

var appEnv = cfenv.getAppEnv();
console.log(appEnv.services);
var weather_host = appEnv.services["weatherinsights"] 
        ? appEnv.services["weatherinsights"][0].credentials.url // Weather credentials passed in
        : "https://443c601f-53bd-460e-aeab-21f85f5df7bc:xs48O8pSRA@twcservice.mybluemix.net"; // or copy your credentials url here for standalone
let qs = {
  units: "e",
  language: "en"
};

app.get('/', async function(req, res) {
  let toShow = [];
  for (let i = 0; i < regions.length; i++) {
    //initialize a new row
    let newRow = {
      region: regions[i],
      temp_ibm: "NA",
      temp_acc: "NA",
      temp_nws: "NA"
    };
    //IBM API
    let geocode = locations[i].split(",");
    let path = "/api/weather/v1/geocode/" + geocode[0] + "/" + geocode[1] + "/forecast/hourly/48hour.json";
    let url = weather_host + path;
    let options_ibm = {
      url: url,
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json"
    },
    qs: qs
    };
    let temp_ibm = undefined;
    let temp_acc = undefined;
    let temp_nws = undefined;
    try {
      let data_ibm = await get_temp(options_ibm);
      //console.log(data_ibm);
      temp_ibm = data_ibm["forecasts"][0].temp;
    }
    catch(e) {
      console.log(e);
    }
    // AccuWeather API
    let options_acc = {
      url: "http://apidev.accuweather.com/currentconditions/v1/" + keys[i] + ".json?language=en&apikey=hoArfRosT1215",
      method: "GET"
    };
    try {
      //accuweather
      //options.url = "http://apidev.accuweather.com/currentconditions/v1/" + keys[0] + ".json?language=en&apikey=hoArfRosT1215";
      if (keys[i]) {
        let data_acc = await get_temp(options_acc);
        //console.log(data_acc[0]["Temperature"]["Metric"]["Value"]);
        temp_acc = data_acc[0]["Temperature"]["Imperial"]["Value"];
        //console.log(temp_acc);
      } 
    } catch(e) {
      console.log(e);
    }
    // National Weather Service API
    url_nws = "https://api.weather.gov/points/" + locations[i] +"/forecast/hourly";
    try {
      temp_nws = await get_nws(url_nws);
    } catch(e) {
      console.log(e);
    }
    //put new data together
    if(temp_ibm) newRow.temp_ibm = temp_ibm;
    if(temp_acc) newRow.temp_acc = temp_acc;
    if(temp_nws) newRow.temp_nws = temp_nws;
    toShow.push(newRow);
  }
  //res.send(temps);
  res.render('table',{items: toShow});
});

app.listen(process.env.PORT || appEnv.port, function() {
  console.log("server starting on " + process.env.PORT);
});
