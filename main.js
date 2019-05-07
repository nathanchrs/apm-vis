
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
    return {
      nodes: [],
      links: []
    }; // No data for the matching year
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

const sankey = d3.sankey()
  .extent([[0, 16], [360, 240]])
  .nodeId(d => d.id)
  .nodeAlign(d3.sankeyJustify)
  .nodeSort(null) // Follow input order
  .nodePadding(10)
  .nodeWidth(3);

d3.csv('sankey.csv', d3.autoType)
  .then(function (rawData) {
    const data = transformSankeyData(rawData, 2018);
    const sankeyGraph = sankey(data);

    let sankeySvg = d3.select('#sankey-diagram')
      .attr('viewBox', '0 0 480 260');

    // Draw links
    sankeySvg.append('g')
      .classed('links', true)
      .selectAll('path')
      .data(sankeyGraph.links)
      .enter()
        .append('path')
          .classed('link', true)
          .attr('d', d3.sankeyLinkHorizontal())
          .attr('fill', 'none')
          .attr('stroke', d => d.color)
          .attr('stroke-width', d => d.width)
          .append('title')
            .text(d => `${d.title}\n${d.value.toLocaleString()}%`);


    // Draw node
    sankeySvg.append('g')
      .classed('nodes', true)
      .selectAll('rect')
      .data(sankeyGraph.nodes)
      .enter()
      .append('rect')
      .classed('node', true)
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', '#000');

  })
  .catch(function (err) {
    console.error(err);
  });
