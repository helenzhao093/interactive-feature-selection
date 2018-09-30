/*** @jsx React.DOM */

function getData(){
  return new Promise(function(resolve, reject) {
    d3.json('/calculate', function(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    })
  })
}

getData()
  .then(function(data) {
    console.log(data)
    ReactDOM.render(
      <AppInterface
        dotSrc={data.dotSrc}
        markovBlanketSelected={data.markovBlanketSelected}
        graph={data.graph}
        isEdgeSelected={data.isEdgeSelected}
        isNodeSelected={data.isNodeSelected}
        featureSchema={data.featureSchema}
        featureData={data.featureData}
        classNames={data.classNames}/>,
      document.getElementById('root')
    );
  })

/*
data={data.histogramData}
featureData={data.featureData}
summaryData={data.summaryData}
featureDistribution={data.featureDistribution}
*/
