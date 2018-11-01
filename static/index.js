/*** @jsx React.DOM */

function getData(){
  return new Promise(function(resolve, reject) {
    d3.json('/getFeatures', function(error, data) {
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
    //console.log(data)
    ReactDOM.render(
        <AppInterface
            features={data.featureData}
            classNames={data.classNames}
        />,
      document.getElementById('root')
    );
  })



/*
<AppInterface
            dotSrc={data.dotSrc}
            markovBlanketSelected={data.markovBlanketSelected}
            graph={data.graph}
            features={data.featureData}
            isEdgeSelected={data.isEdgeSelected}
            isNodeSelected={data.isNodeSelected}
            classNames={data.classNames}
        />,


data={data.histogramData}
featureData={data.featureData}
summaryData={data.summaryData}
featureDistribution={data.featureDistribution}

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
        />,
*/
