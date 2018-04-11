var regions = ["Wilmington", "New Castle County", "Middletown", "Newark", "Kent County",
"Dover", "Sussex County", "Beaches", "Georgetown", "Western Sussex"]

var locations = ["39.74,-75.54", "39.54,-75.67", "39.45,-75.72", "39.68,-75.75",
"39.14,-75.43", "39.16,-75.52", "38.65,-75.43", "38.54,-75.06", "38.69,-75.39", "38.76,-75.60"]

var keys = ["327535", "1-5837_1_POI_AL", "2218503", "337531", undefined, "332276", undefined, undefined, undefined, undefined]
function weatherAPI(path, qs, done) {
  var url = weather_host + path;
  console.log(url, qs);
  request({
      url: url,
      method: "GET",
      headers: {
          "Content-Type": "application/json;charset=utf-8",
          "Accept": "application/json"
      },
      qs: qs
  }, function(err, req, data) {
      if (err) {
          done(err);
      } else {
          if (req.statusCode >= 200 && req.statusCode < 400) {
              try {
                  done(null, JSON.parse(data));
              } catch(e) {
                  console.log(e);
                  done(e);
              }
          } else {
              console.log(err);
              done({ message: req.statusCode, data: data });
          }
      }
  });
};
/*
function get_weather_from_ibm(geocode) {
  let geocode = geocode.split(",");
  weatherAPI("/api/weather/v1/geocode/" + geocode[0] + "/" + geocode[1] + "/forecast/daily/10day.json", {
    units: req.query.units || "m",
    language: req.query.language || "en"
}
}
*/
module.exports = {
  regions: regions,
  locations: locations,
  keys: keys
}