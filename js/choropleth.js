let choroplethCurrentLevel;

function getDataPoint(data, year, province, level) {
  if (data.byYearAndProvince['$' + year] && data.byYearAndProvince['$' + year]['$' + province]) {
    return data.byYearAndProvince['$' + year]['$' + province][0][level];
  }
  return 0;
}

function getDataYears(data) {
  const years = Object.keys(data.byYear).map(x => +x.slice(1));
  years.sort();
  return years;
}

function drawChoropleth(topoJsonData, data, year, level) {
  choroplethCurrentLevel = level;

  // Year slider
  const years = getDataYears(data);
  choroplethYearSlider
    .min(years[0])
    .max(years[years.length - 1])
    .tickValues(years)
    .marks(years)
    .on('onchange', newYear => {
      updateChoropleth(topoJsonData, data, newYear, choroplethCurrentLevel);
    });

  sliderContainer.call(choroplethYearSlider);
  sliderContainer.append('text')
    .attr('transform', 'translate(-20, -20)')
    .classed('slider-label', true);

  // Level picker
  pickerContainer.append('text')
    .classed('picker-title', true)
    .text('Jenjang:');

  // Legend
  mapLegendContainer.append('text')
    .attr('fill', '#888')
    .attr('transform', 'translate(-6, -20)')
    .classed('legend-title', true)
    .text('Angka Partisipasi Murni (APM)');
  mapLegendContainer.selectAll('text.legend-label')
    .data(choroplethLegendText);

  updateChoropleth(topoJsonData, data, year, level);
}

function updateChoropleth(topoJsonData, data, year, level) {
  const geoJsonData = topojson.feature(topoJsonData, topoJsonData.objects.states_provinces);

  // Map
  const mapPaths = mapContainer.selectAll('path')
    .data(geoJsonData.features, d => d.properties.province);

  mapPaths.exit().remove();
  const mapPathsEnter = mapPaths.enter()
    .append('path')
      .attr('class', 'province')
    .on('mouseenter', d => {
      d3.select(d3.event.target).attr('stroke', '#222');
      mapTooltip.transition().style('opacity', 0.9);
      mapTooltip.html(d.properties.province + '<br />APM: '
        + getDataPoint(data, choroplethYearSlider.value(), d.properties.province, choroplethCurrentLevel) + '%');
    })
    .on('mousemove', d => {
      mapTooltip
        .style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY) + 'px');
    })
    .on('mouseleave', d => {
      d3.select(d3.event.target).attr('stroke', '');
      mapTooltip.transition().style('opacity', 0);
    });

  mapPathsEnter.merge(mapPaths)
    .transition()
      .attr('d', geoPath)
      .style('fill', d => choroplethColorScale(getDataPoint(data, year, d.properties.province, level)));

  // Legend
  const legendBoxes = mapLegendContainer.selectAll('rect')
    .data(choroplethLegendColors);

  legendBoxes.exit().remove();
  const legendBoxesEnter = legendBoxes.enter()
    .append('rect')
      .attr('y', 6)
      .attr('width', 30)
      .attr('height', 8);
  legendBoxesEnter.merge(legendBoxes)
    .attr('x', (d, i) => i * 30)
    .style("fill", d => d);

  const legendLabels = mapLegendContainer.selectAll('text.legend-label')
    .data(choroplethLegendText);

  legendLabels.exit().remove();
  const legendLabelsEnter = legendLabels.enter()
    .append('text')
    .classed('legend-label', true)
    .attr('y', 0)
    .attr('fill', '#888')
    .style('text-anchor', 'middle')
  legendLabelsEnter.merge(legendLabels)
    .attr('x', (d, i) => i * 30)
    .text(d => d);

  // Slider
  choroplethYearSlider.silentValue(year);
  choroplethSvg.select('.slider-label').text('Tahun: ' + year);

  // Level picker
  const pickerOptions = ['sd', 'smp', 'sma'];
  const pickerOptionLabels = {
    'sd': 'SD',
    'smp': 'SMP',
    'sma': 'SMA'
  };

  const pickerBoxes = pickerContainer.selectAll('rect')
    .data(pickerOptions);

  pickerBoxes.exit().remove();
  const pickerBoxesEnter = pickerBoxes.enter()
    .append('rect')
      .classed('picker-box', true)
      .attr('y', -19)
      .attr('width', 40)
      .attr('height', 24)
      .on('click', d => {
        updateChoropleth(topoJsonData, data, choroplethYearSlider.value(), d);
      });
  pickerBoxesEnter.merge(pickerBoxes)
    .classed('active', d => d === level)
    .attr('x', (d, i) => i * 44 + 75);

  const pickerLabels = pickerContainer.selectAll('text.picker-label')
    .data(pickerOptions);

  pickerLabels.exit().remove();
  const pickerLabelsEnter = pickerLabels.enter()
    .append('text')
      .classed('picker-label', true)
      .attr('y', -2)
      .style('text-anchor', 'middle');

  pickerLabelsEnter.merge(pickerLabels)
    .classed('active', d => d === level)
    .attr('x', (d, i) => i * 44 + 95)
    .text(d => pickerOptionLabels[d]);

  choroplethCurrentLevel = level;

  const apmLevelDescriptions = {
    'sd': 'APM untuk jenjang SD adalah persentase anak usia 7-12 tahun yang mengikuti sekolah dasar',
    'smp': 'APM untuk jenjang SMP adalah persentase anak usia 13-15 tahun yang mengikuti sekolah menengah pertama',
    'sma': 'APM untuk jenjang SMA adalah persentase anak usia 16-18 tahun yang mengikuti sekolah menengah atas atau sekolah menengah kejuruan'
  };
  d3.select('.apm-level-description')
    .text(apmLevelDescriptions[choroplethCurrentLevel]);
}

// Setup projection
const geoPath = d3.geoPath().projection(
  d3.geoEquirectangular()
  .scale(1000)
  .translate([-1650, 110])
);

// Setup color scale
var choroplethLegendText = ["%", "60", "65", "70", "75", "80", "85", "90", "95"];
const choroplethLegendColors = ["#bbdefb", "#90caf9", "#64b5f6", "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0"];
const choroplethColorScale = d3.scaleThreshold()
  .domain([60, 65, 70, 75, 80, 85, 90, 95])
  .range(choroplethLegendColors);

// Setup container SVG
const choroplethSvg = d3.select('#choropleth')
  .attr('viewBox', '0 0 1200 460');

const mapContainer = choroplethSvg.append('g')
  .classed('map', true);

const mapLegendContainer = choroplethSvg.append('g')
  .classed('map-legend', true)
  .attr('transform', 'translate(10, 300)');

const sliderContainer = choroplethSvg.append('g')
  .attr('transform', 'translate(20, 380)');

const pickerContainer = choroplethSvg.append('g')
  .attr('transform', 'translate(130, 360)');

const distributionContainer = choroplethSvg.append('g')
  .attr('transform', 'translate(720, 0)');

// Setup tooltips
const mapTooltip = d3.select('body').append('div')
  .attr('id', 'map-tooltip')
  .attr('class', 'tooltip')
  .style("opacity", 0);

const distributionTooltip = d3.select("body").append("div")
  .attr('id', 'distribution-tooltip')
  .attr('class', 'tooltip')
  .style("opacity", 0);

const choroplethYearSlider = d3
  .sliderHorizontal()
  .width(774)
  .tickFormat(d3.format('d'))
  .displayValue(false);

Promise.all([
  d3.csv('data/choropleth.csv'),
  d3.json('data/indonesia.json')
])
  .then(([data, topoJsonData]) => {
    const provinces = topojson.feature(topoJsonData, topoJsonData.objects.states_provinces);
    const indexedData = {
      byYear: d3.nest()
        .key(d => d.year)
        .map(data),
      byYearAndProvince: d3.nest()
        .key(d => d.year)
        .key(d => d.province)
        .map(data)
    };

    provinces.features.forEach(d => {
      d.properties.province = d.properties.name;
    });

    const years = getDataYears(indexedData);
    const initialYear = years[years.length - 1];
    const initialLevel = 'sma';
    drawChoropleth(topoJsonData, indexedData, initialYear, initialLevel);
  })
  .catch(err => console.error(err));
