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
    ReactDOM.render(
      <Interface data={data.histogramData}
      featureData={data.featureData}
      summaryData={data.summaryData}
      featureDistribution={data.featureDistribution}/>,
      document.getElementById('root')
    );
  })
