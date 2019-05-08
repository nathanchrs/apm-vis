var mapMargin = { top: 20, right: 20, bottom: 20, left: 20 };
var width = 1000 - mapMargin.left - mapMargin.right,
  height = 512 - mapMargin.top - mapMargin.bottom,
  formatPercent = d3.format(".1%");

var distributionMargins = { top: 20, right: 20, bottom: 30, left: 40 },
  widths = 90 - distributionMargins.left - distributionMargins.right,
  heights = 600 - distributionMargins.top - distributionMargins.bottom;

var yValue = function (d) { return d.APM },
  yScale = d3.scaleLinear().range([height, 0])
    .domain([70, 100]),
  yMap = function (d) { return yScale(yValue(d)) },
  yAxis = d3.axisLeft(yScale);

var mapSvg = d3.select("#map").append("svg")
  .attr("width", width + mapMargin.left + mapMargin.right)
  .attr("height", height + mapMargin.top + mapMargin.bottom)
  .append("g")
  .attr("transform", "translate(" + mapMargin.left + "," + mapMargin.top + ")");

var distributionSvg = d3.select("#distribution").append("svg")
  .attr("width", widths + distributionMargins.left + distributionMargins.right)
  .attr("height", heights + distributionMargins.top + distributionMargins.bottom)
  .style("margin-left", distributionMargins.left)
  .append("g")
  .attr("transform", "translate(" + distributionMargins.left + "," + distributionMargins.top + ")");

var distributionTooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var mapTooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var promises = [];
promises.push(d3.csv("data/indonesia.csv"));
promises.push(d3.json("data/indonesia.json"));

Promise.all(promises)
  .then(values => {
    ready(values[0], values[1]);
  })
  .catch(error => console.error(error));

var legendText = ["", "87.5", "90", "92.5", "95", "97.5"];
var legendColors = ["#CCCCFF", "#66CCCC", "#6699CC", "#3366CC", "#333366"];

function ready(data, us) {
  var provinces = topojson.feature(us, us.objects.states_provinces);
  var dataByProvinces = d3.nest()
    .key(function (d) { return d.province; })
    .key(function (d) { return d.year; })
    .map(data);
  var dataByYear = d3.nest()
    .key(function (d) { return d.year; })
    .map(data);

  provinces.features.forEach(function (d) {
    d.properties.years = dataByProvinces["$" + d.properties.name];
  });

  var color = d3.scaleThreshold()
    .domain([87.5, 90, 92.5, 95, 97.5])
    .range(["#CCCCFF", "#66CCCC", "#6699CC", "#3366CC", "#333366"]);

  var projection = d3.geoEquirectangular()
    .scale(1050)
    .rotate([-120, 0])
    .translate([width / 2, height / 2]);

  var path = d3.geoPath()
    .projection(projection);

  var provinceShapes = mapSvg.selectAll(".county")
    .data(provinces.features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path);

  provinceShapes
    .on("mouseover", function (d) {
      mapTooltip.transition()
        .duration(250)
        .style("opacity", 1);
      mapTooltip.html(
        "<p><strong>" + d.properties.years["$1996"][0].province + "</strong></p>"
      )
        .style("left", (d3.event.pageX + 15) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      mapTooltip.transition()
        .duration(250)
        .style("opacity", 0);
    });

  mapSvg.append("path")
    .datum(topojson.feature(us, us.objects.states_provinces, function (a, b) { return a !== b; }))
    .attr("class", "states")
    .attr("d", path);

  var legend = mapSvg.append("g")
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
    .attr("y", 16)
    .style("text-anchor", "middle")
    .text(function (d, i) { return legendText[i]; });

  // y-axis
  distributionSvg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Protein (g)");

  // // draw dots
  // var dots = newSvg.selectAll(".dot")
  //   .data(dataByYear)
  //   .enter().append("circle")
  //   .attr("class", "dot")
  //   .attr("r", 7)
  //   .attr("cy", yMap)
  //   .style("fill", function (d) { return color(d.APM); })
  //   .on("mouseover", function (d) {
  //     newTooltip.transition()
  //       .duration(200)
  //       .style("opacity", .9);
  //     newTooltip.html(d.province + " " + d.APM)
  //       .style("left", (d3.event.pageX + 5) + "px")
  //       .style("top", (d3.event.pageY - 28) + "px");
  //   })
  //   .on("mouseout", function (d) {
  //     newTooltip.transition()
  //       .duration(500)
  //       .style("opacity", 0);
  //   });

  function update(year) {
    slider.property("value", year);
    d3.select(".year").text(year);
    provinceShapes.style("fill", function (d) {
      const years = d.properties.years;
      if (years) {
        return color(d.properties.years["$" + year][0].APM)
      }
    });

    // draw dots
    var circles = distributionSvg.selectAll(".dot")
      .data(dataByYear["$" + year]);

    circles.exit().remove();

    circles.enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 7)
      .attr("cy", yMap)
      .style("fill", function (d) { return color(d.APM); })
      .on("mouseover", function (d) {
        distributionTooltip.transition()
          .duration(200)
          .style("opacity", .9);
        distributionTooltip.html(d.province + "<br>" + d.APM + "%")
          .style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        distributionTooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .merge(circles).transition();
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