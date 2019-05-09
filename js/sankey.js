const categoryColors = {
  'lanjut': '#bedcf4',
  'tidak-lanjut': '#e5d3bd',
  'do': '#ffdf9e'
};

const categories = {
  'lanjut': 'Lanjut ke jenjang berikutnya',
  'tidak-lanjut': 'Tidak lanjut setelah lulus',
  'do': 'Drop out'
};

function transformSankeyData(rawData, year) {

  const levels = {
    'sd': 'SD',
    'smp': 'SMP',
    'sma': 'SMA/SMK'
  };

  const nextLevelDescription = {
    'sd': 'SMP',
    'smp': 'SMA/SMK',
    'sma': 'perguruan tinggi'
  };

  const getLinkDescription = function (category, sourceLevel) {
    if (category === 'lanjut') {
      return 'Lanjut ke ' + nextLevelDescription[sourceLevel];
    } else if (category === 'tidak-lanjut') {
      return 'Tidak lanjut sekolah setelah lulus ' + levels[sourceLevel];
    } else if (category === 'do') {
      return 'Drop out dari ' + levels[sourceLevel];
    } else {
      return '';
    }
  }

  const buckets = {
    'lanjut-pt': 'Lanjut ke perguruan tinggi',
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
        description: getLinkDescription(categoryKeys[j], levelKeys[i]),
        color: categoryColors[categoryKeys[j]],
        value: +currentYearData[combinedKey] // Convert CSV values (string) to number
      });
    }
  }

  let nodes = [];
  for (let i = 0; i < levelKeys.length; i++) {
    nodes.push({
      id: levelKeys[i],
      title: levels[levelKeys[i]],
      isLevel: true
    })
  }
  for (let i = 0; i < bucketKeys.length; i++) {
    nodes.push({
      id: bucketKeys[i],
      title: buckets[bucketKeys[i]],
      isLevel: false
    })
  }

  return { nodes, links };
}

function drawSankey(rawData, year) {
  sankeySvg.append('g')
    .classed('links', true);

  sankeySvg.append('g')
    .classed('nodes', true);

  sankeySvg.append('g')
    .classed('node-labels', true);

  sankeySvg.append('g')
    .classed('legend', true)
    .attr('transform', 'translate(0, 300)');

  const years = rawData.map(row => row.year);
  sankeyYearSlider
    .min(years[0])
    .max(years[years.length - 1])
    .tickValues(years)
    .marks(years)
    .on('onchange', newYear => {
      updateSankey(rawData, newYear);
    });

  const sliderContainer = sankeySvg.append('g')
    .attr('transform', 'translate(20, 432)');

  sliderContainer.call(sankeyYearSlider);
  sliderContainer.append('text')
    .attr('fill', '#555')
    .attr('transform', 'translate(-20, -20)')
    .classed('slider-label', true);

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

  const linksEnter = links.enter()
    .append('path')
      .classed('link', true)
      .attr('fill', 'none')
      .attr('pointer-events', 'visibleStroke')
      .attr('opacity', 1)
      .on('mouseenter', d => {
        sankeySvg.selectAll('.link').transition().attr('opacity', 0.5);
        d3.select(d3.event.target).transition().attr('opacity', 1);
        sankeyTooltip.transition().style('opacity', 0.9);
        sankeyTooltip.html(d.description + '<br />' + d.value + '% siswa');
      })
      .on('mousemove', d => {
        sankeyTooltip
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY) + 'px');
      })
      .on('mouseleave', d => {
        sankeySvg.selectAll('.link').transition().delay(200).attr('opacity', 1);
        sankeyTooltip.transition().style('opacity', 0);
      });

  const linksUpdate = linksEnter.merge(links);
  linksUpdate.transition()
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

  // Draw node labels
  const nodeLabels = sankeySvg.select('.node-labels')
      .selectAll('text')
      .data(sankeyGraph.nodes);

  nodeLabels.exit().remove();

  const updatedLabels = nodeLabels.enter()
      .append('text')
        .classed('node-label', true)
      .merge(nodeLabels)
        .html(d => d.isLevel
          ? ('<tspan class="bold">' + d.title + '</tspan> <tspan class="">(' + d.value + '%)</tspan>')
          : ('<tspan x="0" dy="1.2em" class="">' + d.title + '</tspan><tspan x="0" dy="1.2em" class="bold">' + d.value + '%</tspan>'))

  updatedLabels.transition()
    .attr('transform', d => 'translate(' + (d.isLevel ? d.x0 : d.x1 + 6) + ', 0)')
    .attr('y', d => d.isLevel ? d.y0 - 10 : (d.y0 + d.y1) / 2 - 20);

  updatedLabels.selectAll('.bold')
    .style('font-weight', 700);

  const legendKeys = ['do', 'tidak-lanjut', 'lanjut'];

  const legendRects = sankeySvg.select('.legend')
    .selectAll('rect')
    .data(legendKeys);

  legendRects.exit().remove();
  legendRects.enter()
    .append('rect')
      .attr('x', 0)
      .attr('width', 14)
      .attr('height', 14)
    .merge(legendRects)
      .attr('y', (d, i) => i * 22)
      .attr('fill', d => categoryColors[d]);

  const legendLabels = sankeySvg.select('.legend')
    .selectAll('text')
    .data(legendKeys);

  legendLabels.exit().remove();
  legendLabels.enter()
    .append('text')
      .classed('legend-label', true)
      .attr('x', 22)
    .merge(legendLabels)
      .attr('y', (d, i) => i * 22 + 12)
      .html(d => categories[d]);

  sankeyYearSlider.silentValue(year);
  sankeySvg.select('.slider-label').text('Angkatan: ' + year)
    .append('title')
    .text('Siswa angkatan ' + year + ' adalah siswa yang masuk kelas 1 SD pada tahun ' + (year - 12))
}

// Setup Sankey generator
const sankey = d3.sankey()
  .extent([[0, 24], [480, 320]])
  .nodeId(d => d.id)
  .nodeAlign(d3.sankeyJustify)
  .nodeSort(null) // Follow input order
  .nodePadding(16)
  .nodeWidth(5);

// Setup container SVG
const sankeySvg = d3.select('#sankey-diagram')
  .attr('viewBox', '0 0 720 480');

// Setup tooltip
const sankeyTooltip = d3.select('body').append('div')
  .attr('id', 'sankey-tooltip')
  .attr('class', 'tooltip')
  .style("opacity", 0);

const sankeyYearSlider = d3
  .sliderHorizontal()
  .width(444)
  .tickFormat(d3.format('d'))
  .displayValue(false);

d3.csv('data/sankey.csv', d3.autoType)
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
