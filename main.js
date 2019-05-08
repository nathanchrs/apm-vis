function transformSankeyData(rawData, year) {

  const levels = {
    'sd': 'SD',
    'smp': 'SMP',
    'sma': 'SMA/SMK'
  };

  const categories = {
    'lanjut': 'Melanjutkan ke jenjang berikutnya',
    'tidak-lanjut': 'Tidak melanjutkan setelah lulus',
    'do': 'Drop out'
  };

  const categoryColors = {
    'lanjut': '#bedcf4',
    'tidak-lanjut': '#e5d3bd',
    'do': '#ffdf9e'
  };

  const buckets = {
    'lanjut-pt': 'Melanjutkan ke perguruan tinggi',
    'tamat-sma': 'Tamat SMA/SMK',
    'tamat-smp': 'Tamat SMP',
    'tamat-sd': 'Tamat SD',
    'tidak-lulus-sd': 'Tidak lulus SD'
  };

  const targetMap = {
    'sma:lanjut': 'lanjut-pt',
    'sma:tidak-lanjut': 'tamat-sma',
    'sma:do': 'tamat-smp',
    'smp:lanjut': 'sma',
    'smp:tidak-lanjut': 'tamat-smp',
    'smp:do': 'tamat-sd',
    'sd:lanjut': 'smp',
    'sd:tidak-lanjut': 'tamat-sd',
    'sd:do': 'tidak-lulus-sd'
  };

  const levelKeys = Object.keys(levels);
  const categoryKeys = Object.keys(categories);
  const bucketKeys = Object.keys(buckets);

  let currentYearData;
  for (let i = 0; i < rawData.length; i++) {
    if (rawData[i].year == year) {
      currentYearData = rawData[i];
    }
  }
  if (!currentYearData) {
    return null; // No data for the matching year
  }

  let links = [];
  for (let i = 0; i < levelKeys.length; i++) {
    for (let j = 0; j < categoryKeys.length; j++) {
      const combinedKey = levelKeys[i] + ':' + categoryKeys[j];
      links.push({
        source: levelKeys[i],
        target: targetMap[combinedKey],
        title: categories[categoryKeys[j]],
        color: categoryColors[categoryKeys[j]],
        value: +currentYearData[combinedKey] // Convert CSV values (string) to number
      });
    }
  }

  let nodes = [];
  for (let i = 0; i < levelKeys.length; i++) {
    nodes.push({
      id: levelKeys[i],
      title: levels[levelKeys[i]]
    })
  }
  for (let i = 0; i < bucketKeys.length; i++) {
    nodes.push({
      id: bucketKeys[i],
      title: buckets[bucketKeys[i]]
    })
  }

  return { nodes, links };
}

function drawSankey(rawData, year) {
  sankeySvg.append('g')
    .classed('links', true);

  sankeySvg.append('g')
    .classed('nodes', true);

  const years = rawData.map(row => row.year);
  yearSlider
    .min(years[0])
    .max(years[years.length - 1])
    .tickValues(years)
    .on('onchange', newYear => {
      updateSankey(rawData, newYear);
    });

  sankeySvg.append('g')
    .attr('transform', 'translate(20, 460)')
    .call(yearSlider);

  updateSankey(rawData, year);
}

function updateSankey(rawData, year) {
  const data = transformSankeyData(rawData, year);
  if (!data) {
    console.error('No data for year ' + year);
    return;
  }
  const sankeyGraph = sankey(data);

  // Draw links
  const links = sankeySvg.select('.links')
    .selectAll('path')
    .data(sankeyGraph.links);

  links.exit().remove();

  links.enter()
    .append('path')
      .classed('link', true)
      .attr('fill', 'none')
    .merge(links)
      .transition()
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke', d => d.color)
        .attr('stroke-width', d => d.width);

  // Draw nodes
  const nodes = sankeySvg.select('.nodes')
    .selectAll('rect')
    .data(sankeyGraph.nodes);

  nodes.exit().remove();

  nodes.enter()
    .append('rect')
      .classed('node', true)
      .attr('fill', '#000')
    .merge(nodes)
      .transition()
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0);

  yearSlider.silentValue(year);
}

// Setup Sankey generator
const sankey = d3.sankey()
  .extent([[0, 24], [600, 400]])
  .nodeId(d => d.id)
  .nodeAlign(d3.sankeyJustify)
  .nodeSort(null) // Follow input order
  .nodePadding(20)
  .nodeWidth(6);

// Setup container SVG
const sankeySvg = d3.select('#sankey-diagram')
  .attr('viewBox', '0 0 750 500');

const yearSlider = d3
  .sliderHorizontal()
  .step(1)
  .width(400)
  .tickFormat(d3.format('d'))
  .displayValue(false);

d3.csv('sankey.csv', d3.autoType)
  .then(function (rawData) {
    if (rawData && rawData.length) {
      rawData.sort((a, b) => a.year - b.year);
      const initialYear = rawData[rawData.length - 1].year;
      drawSankey(rawData, initialYear);
    }
  })
  .catch(function (err) {
    console.error(err);
  });
