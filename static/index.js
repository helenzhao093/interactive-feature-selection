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
        markovBlanketSelected={data.markovBlanketSelected}/>,
      document.getElementById('root')
    );
  })

/*
data={data.histogramData}
featureData={data.featureData}
summaryData={data.summaryData}
featureDistribution={data.featureDistribution}
*/
