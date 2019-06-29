/*** @jsx React.DOM */


_LTracker.push('Hello World');

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
