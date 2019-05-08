var margin = { top: 20, right: 20, bottom: 20, left: 20 };
width = 1000 - margin.left - margin.right,
  height = 512 - margin.top - margin.bottom,
  formatPercent = d3.format(".1%");

var svg = d3.select("#map").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var promises = [];
promises.push(d3.csv("data/indonesia.csv"));
promises.push(d3.json("data/indonesia.json"));

Promise.all(promises)
  .then(values => {
    ready(null, values[0], values[1]);
  })
  .catch(error => console.error(error));

var legendText = ["", "87.5", "90", "92.5", "95", "97.5"];
var legendColors = ["#CCCCFF", "#66CCCC", "#6699CC", "#3366CC", "#333366"];


function ready(error, data, us) {
  // console.log(us.objects);
  var counties = topojson.feature(us, us.objects.states_provinces);

  // data.forEach(function (d) {
  //   d.year = +d.year;
  //   d.fips = +d.fips;
  //   d.rate = +d.rate;
  // });

  var dataByCountyByYear = d3.nest()
    .key(function (d) { return d.province; })
    .key(function (d) { return d.year; })
    .map(data);

  // console.log(dataByCountyByYear);
  // console.log(counties.features);
  counties.features.forEach(function (county) {
    // console.log(county);
    // console.log("$" + county.properties.name);
    county.properties.years = dataByCountyByYear["$" + county.properties.name];
  });
  // console.log(counties.features);

  var color = d3.scaleThreshold()
    .domain([87.5, 90, 92.5, 95, 97.5])
    .range(["#CCCCFF", "#66CCCC", "#6699CC", "#3366CC", "#333366"]);

  var projection = d3.geoEquirectangular()
    .scale(1050)
    .rotate([-120, 0])
    .translate([width / 2, height / 2]);

  var path = d3.geoPath()
    .projection(projection);

  var countyShapes = svg.selectAll(".county")
    .data(counties.features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path);

  countyShapes
    .on("mouseover", function (d) {
      tooltip.transition()
        .duration(250)
        .style("opacity", 1);
      tooltip.html(
        "<p><strong>" + d.properties.years["$1996"][0].province + ", " + d.properties.years["$1996"][0].province + "</strong></p>" +
        "<table><tbody><tr><td class='wide'>APM rate in 1996:</td><td>" + formatPercent((d.properties.years["$1996"][0].APM) / 100) + "</td></tr>" +
        "<tr><td>APM rate in 1998:</td><td>" + formatPercent((d.properties.years["$1998"][0].APM) / 100) + "</td></tr>" +
        "<tr><td>Change:</td><td>" + formatPercent((d.properties.years["$1998"][0].APM - d.properties.years["$1996"][0].APM) / 100) + "</td></tr></tbody></table>"
      )
        .style("left", (d3.event.pageX + 15) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(250)
        .style("opacity", 0);
    });

  // console.log(us.objects.states_provinces);
  svg.append("path")
    .datum(topojson.feature(us, us.objects.states_provinces, function (a, b) { return a !== b; }))
    .attr("class", "states")
    .attr("d", path);

  var legend = svg.append("g")
    .attr("id", "legend");

  var legenditem = legend.selectAll(".legenditem")
    .data(d3.range(6))
    .enter()
    .append("g")
    .attr("class", "legenditem")
    .attr("transform", function (d, i) { return "translate(" + i * 31 + ",0)"; });

  legenditem.append("rect")
    .attr("x", width - 240)
    .attr("y", -7)
    .attr("width", 30)
    .attr("height", 6)
    .attr("class", "rect")
    .style("fill", function (d, i) { return legendColors[i]; });

  legenditem.append("text")
    .attr("x", width - 240)
    .attr("y", -10)
    .style("text-anchor", "middle")
    .text(function (d, i) { return legendText[i]; });

  function update(year) {
    slider.property("value", year);
    d3.select(".year").text(year);
    countyShapes.style("fill", function (d) {
      const years = d.properties.years;
      if (years) {
        return color(d.properties.years["$" + year][0].APM)
      }
    });
  }

  var slider = d3.select(".slider")
    .append("input")
    .attr("type", "range")
    .attr("min", 1996)
    .attr("max", 1998)
    .attr("step", 1)
    .on("input", function () {
      var year = this.value;
      update(year);
    });

  update(1996);

}

d3.select(self.frameElement).style("height", "685px");