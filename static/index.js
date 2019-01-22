/*** @jsx React.DOM */

const client = new KeenTracking({
    projectId: '5c461ee4c9e77c0001cf1b79',
    writeKey: '16FCE924C6C75C4131CD671F540F04C91C1BF596A13DE9B1AE2158C318E1D7C3D0D2A2C6A98E95B2D64A600BC45D841549607338EF5B02EAFFA7C1B3791A3547F7AA5E2C55370FBC57DB7C95EFB1F257A4F7E738F92E8739913FA1CA641094CC'
});

var IDFun = function () {
    var userId = prompt('Please enter your ID.');
    return parseInt(userId);
    //return '_' + Math.random().toString(36).substr(2, 9);
};



const userID = IDFun();
console.log(userID);

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
            description={data.description}
            targetName={data.targetName}
            datasetName={data.datasetName}
        />,
      document.getElementById('root')
    );
  })
