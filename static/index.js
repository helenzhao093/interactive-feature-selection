/*** @jsx React.DOM */

function getData(){
  return new Promise(function(resolve, reject) {
    d3.json('/markovBlanket', function(error, data) {
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
            featureData={data.featureData}
            featureSchema={data.featureSchema}
            classNames={data.classNames}
            markovBlanket={data.markovBlanket}
            MI={data.MI}
            consistencyMB={data.consistencyMB}
            //consistencyEK={data.consistencyEK}
        />,
      document.getElementById('root')
    );
  })



/*
data={data.histogramData}
featureData={data.featureData}
summaryData={data.summaryData}
featureDistribution={data.featureDistribution}


*/
