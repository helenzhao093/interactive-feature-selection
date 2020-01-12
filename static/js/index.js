/*** @jsx React.DOM */

var IDFun = function () {
    let d = new Date();
    return d.getMilliseconds().toString() + d.getMinutes().toString()
    //var userId = prompt('Please enter your ID.');
    //return parseInt(userId);
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
